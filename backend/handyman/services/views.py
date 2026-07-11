from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Service, Category
from handymen.models import Handyman
from handymen.serializers import HandymanSerializer
from .serializers import ServiceSerializer, CategorySerializer

# Create your views here.

# ── List + Create ─────────────────────────────────────────
class ServiceListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        services = Service.objects.all().order_by('-created_at')
        data = ServiceSerializer(services, many=True, context={'request':request}).data
        return Response(data)

    def post(self, request):
        s = ServiceSerializer(data=request.data, context={'request':request})
        s.is_valid(raise_exception=True)
        s.save(created_by=request.user)
        return Response(s.data, status=201)

# ── Retrieve + Update + Delete ────────────────────────────
class ServiceDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:    return Service.objects.get(pk=pk)
        except: return None

    def get(self, request, pk):
        s = self.get_object(pk)
        if not s: return Response(status=404)
        return Response(ServiceSerializer(s, context={'request':request}).data)

    def patch(self, request, pk):
        s = self.get_object(pk)
        if not s: return Response(status=404)
        ser = ServiceSerializer(s, data=request.data, partial=True, context={'request':request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        s = self.get_object(pk)
        if not s: return Response(status=404)
        s.delete()
        return Response(status=204)


# ── Categories ────────────────────────────────────────────
class CategoryListCreateView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_authenticators(self):
        # GET is public — do not run JWT auth (an expired/invalid token
        # would otherwise raise 401 even though permission is AllowAny).
        if self.request.method == 'GET':
            return []
        return super().get_authenticators()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        service_id = request.query_params.get('service_id')
        qs = Category.objects.select_related('service').all()
        if service_id:
            qs = qs.filter(service_id=service_id)
        qs = qs.order_by('service__name', 'name')
        return Response(CategorySerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        ser = CategorySerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data, status=201)


class CategoryDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Category.objects.select_related('service').get(pk=pk)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(status=404)
        return Response(CategorySerializer(obj, context={'request': request}).data)

    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(status=404)
        ser = CategorySerializer(obj, data=request.data, partial=True, context={'request': request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response(status=404)
        obj.delete()
        return Response(status=204)


class CategoryByServiceView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []  # public

    def get(self, request, service_id):
        qs = Category.objects.filter(service_id=service_id).order_by('name')
        return Response(CategorySerializer(qs, many=True, context={'request': request}).data)

