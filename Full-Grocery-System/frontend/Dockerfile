# ==============================================================================
# FreshMart Grocery System - Frontend Dockerfile
# Lightweight Nginx Alpine web server on port 8000
# ==============================================================================

FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy frontend source files
COPY . /usr/share/nginx/html

# Copy custom nginx configuration listening on port 8000
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose web server port
EXPOSE 8000

CMD ["nginx", "-g", "daemon off;"]
