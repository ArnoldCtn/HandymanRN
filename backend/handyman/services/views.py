from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Service
from handymen.models import Handyman
from handymen.serializers import HandymanSerializer
from .serializers import ServiceSerializer

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

