echo "Sabar Lagi proses setup ini memerlukan waktu beberapa menit"
apt install ffmpeg -y
npm install
npm install -g pm2
pm2 start index.js --name api