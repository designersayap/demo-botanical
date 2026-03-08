import "./globals.css";


export const metadata = {
  title: "Botanical Beli Diffuser Gratis Linen Spray | Promo Botanical Essence",
  description: "Ciptakan suasana tenang di rumah dengan Botanical Essence Diffuser. Beli sekarang dan nikmati bonus Linen Spray gratis! Stok terbatas, klaim promonya di sini.",
  keywords: "botanical essence, diffuser aromaterapi, promo diffuser, linen spray gratis, pengharum ruangan, home fragrance, paket bundling",
  icons: { icon: "https://cdn-icons-png.flaticon.com/256/25/25231.png" },
  alternates: { canonical: "https://github.com/google-gemini/cookbook" },
  openGraph: {
    title: "Mau Linen Spray Gratis? Cek Promo Diffuser Botanical Essence Ini!",
    description: "Bikin rumah wangi dan nyaman jadi lebih hemat. Beli Diffuser dapat gratisan Linen Spray. Buruan cek sebelum kehabisan!",
    
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Poppins:wght@600;700&display=swap"
  rel="stylesheet"
/>
<link
  href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap"
  rel="stylesheet"
/>
        
        {/* Favicon */}
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/256/25/25231.png" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Mau Linen Spray Gratis? Cek Promo Diffuser Botanical Essence Ini!" />
        <meta property="og:description" content="Bikin rumah wangi dan nyaman jadi lebih hemat. Beli Diffuser dapat gratisan Linen Spray. Buruan cek sebelum kehabisan!" />
        <meta property="og:image" content="" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://github.com/google-gemini/cookbook" />
        
      </head>
      <body>
        {children}
        
        {/* Analytics Scripts */}
        

        

        

        
      </body>
    </html>
  );
}
