from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from notes.views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path('admin/', admin.site.urls),

    path("notes/user/register/", CreateUser.as_view(), name="register"),

    path("notes/token/obtain/", TokenObtainPairView.as_view(), name="token_create"),
    path("notes/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api-atuh/", include("rest_framework.urls")),
    path("", include("notes.urls")),
]

# 在开发环境中提供媒体文件服务
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
