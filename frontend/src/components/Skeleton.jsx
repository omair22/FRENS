import React from 'react'

const Skeleton = ({ className, variant = 'rect' }) => {
  const base = "skeleton rounded-2xl"
  const variants = {
    rect: "w-full h-32",
    circle: "w-12 h-12 rounded-full",
    text: "w-3/4 h-4 rounded-lg",
    title: "w-1/2 h-8 rounded-lg"
  }

  return (
    <div className={`${base} ${variants[variant]} ${className}`} />
  )
}

export const FeedSkeleton = () => (
  <div className="p-6 space-y-6 max-w-md mx-auto">
    <Skeleton variant="title" className="mb-8" />
    <div className="flex gap-4 overflow-x-hidden">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} variant="circle" className="flex-shrink-0" />)}
    </div>
    <Skeleton className="h-40 rounded-[2rem]" />
    <Skeleton className="h-64 rounded-[2rem]" />
  </div>
)

export default Skeleton
