import os
from pathlib import Path
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.conf import settings


def get_cover_upload_path(filename):
    from datetime import datetime
    now = datetime.now()
    date_path = now.strftime('%Y/%m')
    return f'covers/{date_path}/{filename}'


def generate_thumbnail(image_file, size=(300, 300)):
    try:
        img = Image.open(image_file)
        
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        thumb_io = BytesIO()
        img.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)
        
        return thumb_io
    except Exception as e:
        raise ValueError(f"Failed to generate thumbnail: {str(e)}")


def process_cover_image(uploaded_file):
    original_name = Path(uploaded_file.name)
    original_stem = original_name.stem
    original_ext = original_name.suffix.lower() or '.jpg'
    
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    if original_ext not in valid_extensions:
        original_ext = '.jpg'
    
    import uuid
    unique_id = uuid.uuid4().hex[:8]
    new_filename = f"{original_stem}_{unique_id}{original_ext}"
    
    upload_path = get_cover_upload_path(new_filename)
    
    thumb_io = generate_thumbnail(uploaded_file)
    
    thumb_filename = f"{original_stem}_{unique_id}_thumb{original_ext}"
    thumb_path = get_cover_upload_path(thumb_filename)
    
    uploaded_file.seek(0)
    
    return {
        'original_path': upload_path,
        'original_file': uploaded_file,
        'thumb_path': thumb_path,
        'thumb_content': ContentFile(thumb_io.read(), name=thumb_filename),
    }


def delete_cover_files(cover_field):
    if cover_field and cover_field.name:
        try:
            cover_path = Path(settings.MEDIA_ROOT) / cover_field.name
            if cover_path.exists():
                os.remove(cover_path)
            
            thumb_path = get_thumbnail_path(cover_field.name)
            if thumb_path and thumb_path.exists():
                os.remove(thumb_path)
        except Exception:
            pass


def get_thumbnail_path(cover_path):
    if not cover_path:
        return None
    
    path = Path(cover_path)
    thumb_name = f"{path.stem}_thumb{path.suffix}"
    return Path(settings.MEDIA_ROOT) / path.parent / thumb_name
