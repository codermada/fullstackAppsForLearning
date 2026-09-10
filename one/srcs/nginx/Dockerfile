FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

RUN mkdir -p /etc/nginx/ssl && \
    apk add --no-cache openssl && \
    openssl req -x509 -nodes -days 365 \
        -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/C=MG/ST=Analamanga/L=Antananarivo/O=TaskApp/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
