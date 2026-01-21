import { useState } from 'react'

import { Button, Card, Heading, Paragraph } from '@digdir/designsystemet-react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>

      <h1>Vite + React</h1>
      <Card>
        <Button onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </Button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </Card>
      <Card style={{ maxWidth: '320px' }} data-color='bla-1'>
      <Heading>Lykkeland Barneskole</Heading>
      <Paragraph>
        Lykkeland Barneskole er ein trygg og inkluderande nærskule der leik,
        læring og nysgjerrigheit går hand i hand.
      </Paragraph>
      <Paragraph data-size='sm'>Solslett kommune</Paragraph>
    </Card>
    </>
  )
}

export default App
