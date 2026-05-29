FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HOME=/data \
    DATA_ROOT_DIRECTORY=/data/.data_storage \
    SYSTEM_ROOT_DIRECTORY=/data/.cognee_system \
    CACHE_ROOT_DIRECTORY=/data/.cognee_cache \
    COGNEE_LOGS_DIR=/data/logs \
    ENABLE_BACKEND_ACCESS_CONTROL=false

WORKDIR /app

RUN useradd --create-home --home-dir /data --shell /usr/sbin/nologin cognee
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY cognee_local_service /app/cognee_local_service
RUN mkdir -p /data/.data_storage /data/.cognee_system /data/.cognee_cache /data/logs \
  && chown -R cognee:cognee /data /app

USER cognee

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=5).read()"

CMD ["uvicorn", "cognee_local_service.main:app", "--host", "0.0.0.0", "--port", "8000"]
