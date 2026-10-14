FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html portada.css /usr/share/nginx/html/
COPY compartido /usr/share/nginx/html/compartido
COPY comensal /usr/share/nginx/html/comensal
COPY personal /usr/share/nginx/html/personal
COPY caja /usr/share/nginx/html/caja
COPY cocina /usr/share/nginx/html/cocina
COPY mozo /usr/share/nginx/html/mozo
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://localhost/ >/dev/null || exit 1
