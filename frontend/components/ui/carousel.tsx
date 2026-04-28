'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CarouselContextValue = {
  viewportRef: React.RefObject<HTMLDivElement | null>
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) {
    throw new Error('Carousel components must be used inside Carousel')
  }
  return context
}

function Carousel({ className, children }: React.ComponentProps<'div'>) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const updateButtons = React.useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }

    setCanScrollPrev(viewport.scrollLeft > 0)
    setCanScrollNext(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1)
  }, [])

  const scrollByPage = React.useCallback((direction: 'prev' | 'next') => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    const scrollAmount = Math.max(viewport.clientWidth * 0.9, 220)
    viewport.scrollBy({
      left: direction === 'next' ? scrollAmount : -scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  React.useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    updateButtons()

    const onScroll = () => updateButtons()
    const onResize = () => updateButtons()

    viewport.addEventListener('scroll', onScroll)
    window.addEventListener('resize', onResize)

    return () => {
      viewport.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [updateButtons])

  const value = React.useMemo(
    () => ({
      viewportRef,
      scrollPrev: () => scrollByPage('prev'),
      scrollNext: () => scrollByPage('next'),
      canScrollPrev,
      canScrollNext,
    }),
    [canScrollNext, canScrollPrev, scrollByPage],
  )

  return (
    <CarouselContext.Provider value={value}>
      <div className={cn('relative', className)}>{children}</div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { viewportRef } = useCarousel()

  return (
    <div ref={viewportRef} className='overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
      <div className={cn('flex touch-pan-y', className)} {...props} />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('min-w-0 shrink-0 grow-0 basis-full', className)} {...props} />
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      type='button'
      variant='outline'
      size='icon-sm'
      className={cn('absolute -left-3 top-1/2 z-20 -translate-y-1/2', className)}
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      {...props}
    >
      <ChevronLeft className='size-4' />
      <span className='sr-only'>Previous slide</span>
    </Button>
  )
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      type='button'
      variant='outline'
      size='icon-sm'
      className={cn('absolute -right-3 top-1/2 z-20 -translate-y-1/2', className)}
      onClick={scrollNext}
      disabled={!canScrollNext}
      {...props}
    >
      <ChevronRight className='size-4' />
      <span className='sr-only'>Next slide</span>
    </Button>
  )
}

export { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext }
