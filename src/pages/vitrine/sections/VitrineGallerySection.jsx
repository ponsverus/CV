import React from 'react';
import { getPublicUrl } from '../api/vitrineApi';

export default function VitrineGallerySection({ galeriaItems }) {
  if (!galeriaItems.length) return null;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {galeriaItems.map((item) => {
            const url = getPublicUrl('galerias', item.path);
            if (!url) return null;
            return (<div key={item.id} className="mb-3 w-full break-inside-avoid overflow-hidden rounded-custom border border-vborder bg-vcard"><img src={url} alt="Galeria" className="w-full h-auto object-contain bg-vbg" loading="lazy" /></div>);
          })}
        </div>
      </div>
    </section>
  );
}
