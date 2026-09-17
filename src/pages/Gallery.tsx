import { motion } from 'framer-motion';

const IMAGES = [
  "gallery/c1.jpeg",
  "gallery/c2.jpeg",
  "gallery/c3.jpeg",
  "gallery/c4.jpeg",
  "gallery/col1.jpg",
  "gallery/col2.jpg",
  "gallery/col3.jpg",
  "gallery/col4.png",
  "gallery/col5.jpg",
  "gallery/col6.png",
  "gallery/col7.jpg",
  "Hack/h1.png",
  "Hack/h2.jpeg",
  "arts/ar1.jpeg",
  "arts/ar2.jpeg",
  "arts/ar3.jpeg",
  "arts/ar4.jpeg",
  "iic/i1.png",
  "iic/i2.png",
  "iic/i3.png",
  "iic/i4.png",
  "sic/s1.png",
  "sic/s2.png",
  "sic/s3.png",
  "sic/s4.png",
  "nss/n1.png",
  "nss/n2.png",
  "nss/n3.png",
  "nss/n4.png",
  "udaan/u1.jpg",
  "udaan/u2.jpg",
  "udaan/u3.jpg",
  "Ecell/e1.png",
  "Ecell/e2.png",
  "Ecell/e3.png",
  "Ecell/e4.png",
];

export default function Gallery() {
  return (
    <div className="space-y-12 pb-20 px-4 md:px-0">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">Campus Gallery</h1>
        <p className="text-sm md:text-base text-gray-500 font-medium">Capturing the moments that define our university journey.</p>
      </div>

      <div className="columns-1 sm:columns-2 md:columns-2 lg:columns-3 gap-6 space-y-6 px-4">
        {IMAGES.map((src, i) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            key={i} 
            className={`break-inside-avoid overflow-hidden border-8 border-white shadow-xl hover:shadow-2xl transition-all group ${i % 3 === 0 ? 'rounded-[3rem] rounded-tl-[4rem]' : i % 2 === 0 ? 'rounded-[2rem] rounded-br-[4rem]' : 'rounded-[2.5rem]'}`}
          >
            <div className={`overflow-hidden ${i === 6 ? 'aspect-[3/4]' : ''}`}>
              <img 
                src={`${import.meta.env.BASE_URL}${src.startsWith('/') ? src.slice(1) : src}`} 
                alt={`Campus ${i}`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
