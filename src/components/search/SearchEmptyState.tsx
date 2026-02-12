import { Alert, Paragraph } from '@digdir/designsystemet-react';

export function SearchEmptyState() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <Alert>
        <Paragraph>Skriv inn et søkeord i søkefeltet for å starte søket.</Paragraph>
      </Alert>
    </div>
  );
}
