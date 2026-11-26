import { Badge, Card, Container, Flex, Heading, Text } from "@radix-ui/themes";

type ApiMessage = {
  message: string;
};

async function getApiMessage(): Promise<string> {
  const apiUrl = process.env.API_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${apiUrl}/api/message`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = (await response.json()) as ApiMessage;
    return data.message;
  } catch {
    return "The API is currently unavailable.";
  }
}

export default async function Home() {
  const message = await getApiMessage();

  return (
    <main>
      <Container size="2">
        <Card size="4">
          <Flex direction="column" gap="4" align="start">
            <Badge size="2" variant="soft">
              TypeScript monorepo
            </Badge>
            <Heading size="8">Next.js + Express</Heading>
            <Text as="p" size="4" color="gray">
              {message}
            </Text>
          </Flex>
        </Card>
      </Container>
    </main>
  );
}
