import { Alert, Paragraph } from '@digdir/designsystemet-react';
import { SearchForm } from '../../ui/SearchForm';

interface SearchEmptyStateProps {
  onSubmit: (query: string) => void;
  onClear: () => void;
}

export function SearchEmptyState({ onSubmit, onClear }: SearchEmptyStateProps) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      <SearchForm
        initialValue=""
        onSubmit={onSubmit}
        onClear={onClear}
        placeholder="Søk..."
      />
      <Alert>
        <Paragraph>Skriv inn et søkeord for å starte søket.</Paragraph>
      </Alert>
    </div>
  );
}
