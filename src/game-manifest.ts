export interface GameEntry {
  slug: string;
  title: string;
  description: string;
  cover?: string;
  playUrl: string;
  version?: string;
}

let manifestPromise: Promise<GameEntry[]> | null = null;

export async function loadGames(): Promise<GameEntry[]> {
  if (!manifestPromise) {
    manifestPromise = fetch(`${import.meta.env.BASE_URL}game-manifest.json`).then(
      async (response) => {
        if (!response.ok) {
          throw new Error("无法加载游戏清单。");
        }

        const manifest = (await response.json()) as GameEntry[];
        return manifest;
      }
    );
  }

  return manifestPromise;
}

export async function loadGame(slug: string): Promise<GameEntry | undefined> {
  const games = await loadGames();
  return games.find((game) => game.slug === slug);
}

