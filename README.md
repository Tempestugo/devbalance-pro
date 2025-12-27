
````markdown
# DevBalance PRO

Uma aplicação desktop de alta performance desenvolvida com Electron para monitoramento de produtividade.  
O DevBalance PRO rastreia automaticamente o tempo gasto em diferentes aplicações e websites, oferecendo visualizações analíticas para uma melhor gestão do tempo.

---

## Novidades desta Versão

- Monitoramento Nativo v7+  
  Migração para a API nativa mais recente do active-win, eliminando erros de gerenciamento de memória como External Buffers.

- Gráficos Avançados  
  Implementação de linha de tendência mensal com Chart.js e gráfico semanal customizado utilizando HTML e Tailwind CSS.

- Segurança Reforçada  
  Content Security Policy (CSP) otimizada para carregamento seguro de recursos externos como Tailwind e Chart.js.

- Histórico Inteligente  
  Visualização diária que calcula automaticamente:
  - Tempo total monitorado
  - Quantidade de aplicações utilizadas
  - Software mais utilizado  
  Tudo diretamente da base de dados local.

---

## Tecnologias Utilizadas

- Electron
- Node.js
- active-win
- Chart.js
- Tailwind CSS

---

## Instalação e Execução

### Requisitos

- Node.js 16.x ou superior
- npm

### Passo a Passo

1. Clone o projeto
   ```bash
   git clone https://github.com/Tempestugo/devbalance-pro.git
   cd devbalance-pro
````

2. Instale as dependências

   ```bash
   npm install
   ```

3. Inicie a aplicação

   ```bash
   npm start
   ```

4. Gerar executável (.exe)

   ```bash
   npm run build:win
   ```

O executável será gerado na pasta `/dist`.

---

## Estrutura do Projeto

```text
devbalance-pro/
├── build/             # Ícones e recursos de compilação
├── src/
│   ├── main.js        # Processo principal e segurança (CSP)
│   ├── monitor.js     # Lógica de rastreamento assíncrona v7+
│   ├── database.js    # Persistência em JSON local
│   ├── preload.js     # Ponte segura IPC (Main <-> Renderer)
│   ├── renderer.js    # Gestão da interface e gráficos
│   └── index.html     # Estrutura da UI com Tailwind
└── package.json       # Scripts e dependências
```

---

## Como Funciona o Monitoramento

O sistema utiliza um loop de verificação a cada 2 segundos:

* Identificação
  Detecta o nome do processo e o título da janela ativa através do active-win.

* Filtro Inteligente
  Higieniza títulos de janelas e identifica domínios de navegadores conhecidos como GitHub, YouTube e Notion.

* Persistência
  As sessões são gravadas localmente em arquivos JSON organizados por data, por exemplo:

  ```text
  2025-12-27.json
  ```

---

## Configuração de Segurança (CSP)

A aplicação utiliza uma Content Security Policy restritiva, permitindo apenas conexões essenciais:

* cdn.tailwindcss.com
* cdnjs.cloudflare.com
* cdn.jsdelivr.net
* icons.duckduckgo.com

---

## Autor

Desenvolvido por [Tempestugo](https://github.com/Tempestugo)


