import webpush from 'web-push';
const k = webpush.generateVAPIDKeys();
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + k.publicKey);
console.log('VAPID_PRIVATE_KEY=' + k.privateKey);
console.log('\nCopiez ces lignes dans les variables d\'environnement Vercel (la clé privée reste secrète).');
