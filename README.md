# Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Processamento de Documentos

Já podem acessar através do tRPC

```bash
// Upload/processamento/salvamento
trpc.document.uploadDocument.mutate({
  filename: "prova.pdf",
  fileBuffer: base64OuDataUri,
});

// Listar metadados dos documentos
trpc.document.listDocuments.query({
  limit: 20,
  offset: 0,
});

// Buscar documento salvo com base64
trpc.document.getDocumentWithBase64.query({
  documentId: "...uuid...",
});
```

O Upload no browser vai ter que converter o arquivo pra ``base64`` antes de chamar o upload.
