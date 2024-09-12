import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  fonts: {
    body: '"Open Sans", sans-serif',
    heading: '"Open Sans", sans-serif',
  },
  components: {
    Tabs: {
      baseStyle: {
        tab: {
          fontFamily: 'inherit', // Это сохранит стандартный шрифт для Tabbar
        },
      },
    },
  },
})

export default theme