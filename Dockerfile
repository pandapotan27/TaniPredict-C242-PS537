FROM node:18-slim

WORKDIR /app

ENV PORT 8080

# Salin package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Instal dependensi aplikasi
RUN npm install

# Salin seluruh kode aplikasi setelah instalasi dependensi
COPY . .

# Ekspose port yang digunakan oleh aplikasi
EXPOSE 8080

# Perintah untuk menjalankan aplikasi
CMD ["npm", "start"]
