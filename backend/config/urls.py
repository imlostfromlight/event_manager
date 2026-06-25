from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/events/', include('apps.events.urls')),
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Serve uploaded media (QR codes, avatars) in both dev and prod
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
