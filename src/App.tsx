import { AppLayout } from './components/layout/AppLayout'

import { Heading, Paragraph } from '@digdir/designsystemet-react'

function App() {
  return (
    <AppLayout>
      <Heading level={2} data-size='lg'>
        Velkommen
      </Heading>
      <Paragraph>
        Dette er en enkel layout med header, inspirert av Helsedirektoratet.
      </Paragraph>
    </AppLayout>
  )
}

export default App
