import os
import uuid
from datetime import datetime
from pathlib import Path
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings


def generate_cover_path(filename):
    """
    生成封面图片存储路径，按日期分目录
    格式: media/covers/2025/03/filename.jpg
    """
    now = datetime.now()
    year = now.strftime('%Y')
    month = now.strftime('%m')
    
    # 生成唯一文件名
    ext = filename.split('.')[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    
    # 构建相对路径
    relative_path = os.path.join('covers', year, month, unique_name)
    
    return relative_path


def create_thumbnail(image_file, size=(300, 200)):
    """
    创建缩略图
    返回: (thumb_filename, thumb_content)
    """
    # 打开图片
    if hasattr(image_file, 'seek'):
        image_file.seek(0)
    
    image = Image.open(image_file)
    
    # 转换为RGB模式（处理RGBA等模式）
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    
    # 等比例缩放
    image.thumbnail(size, Image.Resampling.LANCZOS)
    
    # 保存到内存
    thumb_io = BytesIO()
    image.save(thumb_io, format='JPEG', quality=85)
    thumb_io.seek(0)
    
    return thumb_io


def save_cover_with_thumbnail(note, image_file):
    """
    保存封面图片并生成缩略图
    
    Args:
        note: Note 实例
        image_file: 上传的图片文件
    
    Returns:
        dict: 包含 cover_url 和 thumbnail_url 的字典
    """
    # 获取原始文件名
    original_name = image_file.name
    ext = original_name.split('.')[-1].lower()
    
    # 生成存储路径
    relative_path = generate_cover_path(original_name)
    full_path = os.path.join(settings.MEDIA_ROOT, relative_path)
    
    # 确保目录存在
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    
    # 重置文件指针
    if hasattr(image_file, 'seek'):
        image_file.seek(0)
    
    # 打开并处理原图
    image = Image.open(image_file)
    
    # 转换为RGB模式
    if image.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
        image = background
    elif image.mode != 'RGB':
        image = image.convert('RGB')
    
    # 限制原图最大尺寸（可选，防止上传过大的图片）
    max_size = (1920, 1080)
    if image.width > max_size[0] or image.height > max_size[1]:
        image.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # 保存原图
    image.save(full_path, format='JPEG', quality=90)
    
    # 生成缩略图
    if hasattr(image_file, 'seek'):
        image_file.seek(0)
    
    thumb_io = create_thumbnail(image_file, size=(300, 200))
    
    # 生成缩略图文件名: {original_name}_thumb.{ext}
    filename_without_ext = os.path.splitext(os.path.basename(relative_path))[0]
    thumb_filename = f"{filename_without_ext}_thumb.jpg"
    thumb_path = os.path.join(os.path.dirname(full_path), thumb_filename)
    
    # 保存缩略图
    with open(thumb_path, 'wb') as f:
        f.write(thumb_io.read())
    
    # 构建URL
    media_url = settings.MEDIA_URL if hasattr(settings, 'MEDIA_URL') else '/media/'
    cover_url = f"{media_url}{relative_path}"
    thumb_relative = os.path.join(os.path.dirname(relative_path), thumb_filename)
    thumbnail_url = f"{media_url}{thumb_relative}"
    
    return {
        'cover_path': relative_path,
        'cover_url': cover_url,
        'thumbnail_path': thumb_relative,
        'thumbnail_url': thumbnail_url,
        'filename': os.path.basename(relative_path)
    }


def delete_cover_files(cover_path, thumbnail_path=None):
    """
    删除封面图片和缩略图文件
    """
    if cover_path:
        full_path = os.path.join(settings.MEDIA_ROOT, cover_path)
        if os.path.exists(full_path):
            os.remove(full_path)
    
    if thumbnail_path:
        thumb_full_path = os.path.join(settings.MEDIA_ROOT, thumbnail_path)
        if os.path.exists(thumb_full_path):
            os.remove(thumb_full_path)


def validate_image_file(image_file):
    """
    验证上传的图片文件
    
    Returns:
        (is_valid, error_message)
    """
    # 检查文件是否存在
    if not image_file:
        return False, "未提供图片文件"
    
    # 检查文件大小（限制10MB）
    max_size = 10 * 1024 * 1024  # 10MB
    if hasattr(image_file, 'size') and image_file.size > max_size:
        return False, f"图片大小不能超过10MB"
    
    # 检查文件类型
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    filename = image_file.name.lower()
    if not any(filename.endswith(ext) for ext in valid_extensions):
        return False, f"不支持的图片格式，请上传: {', '.join(valid_extensions)}"
    
    # 尝试打开图片验证
    try:
        if hasattr(image_file, 'seek'):
            image_file.seek(0)
        image = Image.open(image_file)
        image.verify()
    except Exception as e:
        return False, f"无效的图片文件: {str(e)}"
    
    return True, None
