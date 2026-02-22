'use client'

import { Box } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { useEffect, useState } from 'react'

const animStar = keyframes`
  from { transform: translateY(0px) }
  to { transform: translateY(-2000px) }
`

function multipleBoxShadow(n: number) {
  let value = `${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`
  for (let i = 2; i <= n; i++) {
    value += `, ${Math.floor(Math.random() * 2000)}px ${Math.floor(Math.random() * 2000)}px #FFF`
  }
  return value
}

export function LoginBackground() {
  const [shadows, setShadows] = useState({
    small: '',
    medium: '',
    big: '',
  })

  useEffect(() => {
    setShadows({
      small: multipleBoxShadow(700),
      medium: multipleBoxShadow(200),
      big: multipleBoxShadow(100),
    })
  }, [])

  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      width="100%"
      height="100%"
      bg="radial-gradient(ellipse at bottom, #1B2735 0%, #090A0F 100%)"
      overflow="hidden"
      zIndex="0"
    >
      <Box
        w="1px"
        h="1px"
        bg="transparent"
        boxShadow={shadows.small}
        animation={`${animStar} 50s linear infinite`}
        _after={{
          content: '""',
          position: 'absolute',
          top: '2000px',
          w: '1px',
          h: '1px',
          bg: 'transparent',
          boxShadow: shadows.small,
        }}
      />
      <Box
        w="2px"
        h="2px"
        bg="transparent"
        boxShadow={shadows.medium}
        animation={`${animStar} 100s linear infinite`}
        _after={{
          content: '""',
          position: 'absolute',
          top: '2000px',
          w: '2px',
          h: '2px',
          bg: 'transparent',
          boxShadow: shadows.medium,
        }}
      />
      <Box
        w="3px"
        h="3px"
        bg="transparent"
        boxShadow={shadows.big}
        animation={`${animStar} 150s linear infinite`}
        _after={{
          content: '""',
          position: 'absolute',
          top: '2000px',
          w: '3px',
          h: '3px',
          bg: 'transparent',
          boxShadow: shadows.big,
        }}
      />
    </Box>
  )
}
