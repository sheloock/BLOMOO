'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { CarouselSlide } from '@/types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface CarouselProps {
  slides: CarouselSlide[];
  autoplay?: boolean;
  navigation?: boolean;
  pagination?: boolean;
  className?: string;
}

export default function Carousel({ 
  slides, 
  autoplay = true, 
  navigation = true, 
  pagination = true,
  className = ''
}: CarouselProps) {
  return (
    <div className={`carousel-container ${className}`}>
      <Swiper
        spaceBetween={30}
        centeredSlides={true}
        autoplay={autoplay ? {
          delay: 2500,
          disableOnInteraction: false,
        } : false}
        pagination={pagination ? {
          clickable: true,
        } : false}
        navigation={navigation}
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="slide-content p-4">
              {slide.image && (
                <img 
                  src={slide.image} 
                  alt={slide.title}
                  className="img-fluid mb-3 rounded"
                />
              )}
              <h3 className="slide-title">{slide.title}</h3>
              <p className="slide-description">{slide.description}</p>
              {slide.url && (
                <a 
                  href={slide.url} 
                  className="btn btn-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn More <i className="bi bi-arrow-right"></i>
                </a>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}