import { motion } from 'framer-motion'

export const AnimatedBackground = () => {
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[100px] opacity-50"
      style={{
        background: 'radial-gradient(circle, rgba(147,197,253,0.8) 0%, rgba(59,130,246,0.8) 100%)',
      }}
    >
      <motion.div
        className="w-full h-full"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  )
} 