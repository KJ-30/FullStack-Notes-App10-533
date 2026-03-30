from PIL import Image
from io import BytesIO
from django.core.files import File
from django.core.files.uploadedfile import InMemoryUploadedFile
import os
from datetime import datetime


__all__ = ['process_cover_image', 'create_thumbnail', 'get_thumbnail_filename', 'get_date_based_path', 'save_image_with_thumbnail']


def process_cover_image(image, max_size=(1920, 1080)):
    """
    Process and optimize the cover image
    """
    img = Image.open(image)
    
    # Convert to RGB if needed
    if img.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    
    # Resize if too large
    img.thumbnail(max_size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output = BytesIO()
    img.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)
    
    return output


def create_thumbnail(image, size=(400, 300)):
    """
    Create a thumbnail from the original image
    """
    img = Image.open(image)
    
    # Convert to RGB if needed
    if img.mode in ('RGBA', 'LA'):
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[-1])
        img = background
    
    # Create thumbnail
    img.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Save to BytesIO
    output = BytesIO()
    img.save(output, format='JPEG', quality=75, optimize=True)
    output.seek(0)
    
    return output


def get_thumbnail_filename(original_name):
    """
    Generate thumbnail filename following the format: {original_name}_thumb.{ext}
    """
    name, ext = os.path.splitext(original_name)
    return f"{name}_thumb{ext}"


def get_date_based_path():
    """
    Generate date-based path for storing images: YYYY/MM/
    """
    return datetime.now().strftime('%Y/%m/')


def save_image_with_thumbnail(note, image_file):
    """
    Save both the processed cover image and its thumbnail to the note instance
    """
    from django.core.files.base import ContentFile
    
    # Process main image
    processed_image = process_cover_image(image_file)
    
    # Create thumbnail
    thumbnail_image = create_thumbnail(image_file)
    
    # Get filenames
    original_name = image_file.name
    thumb_filename = get_thumbnail_filename(original_name)
    
    # Save main image
    note.cover_image.save(
        original_name,
        ContentFile(processed_image.getvalue()),
        save=False
    )
    
    # Save thumbnail
    note.cover_thumbnail.save(
        thumb_filename,
        ContentFile(thumbnail_image.getvalue()),
        save=False
    )
