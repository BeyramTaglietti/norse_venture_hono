FROM oven/bun

WORKDIR /

COPY bun.lockb . 
COPY package.json . 

RUN bun install --ignore-scripts

COPY . .

RUN bun run build

CMD ["bun", "start"]