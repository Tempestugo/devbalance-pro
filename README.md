# DevBalance PRO

Uma aplicação desktop de monitoramento de atividades desenvolvida com Electron que rastreia o tempo gasto em aplicativos e websites em tempo real.

## Características

- Monitoramento em tempo real de aplicativos ativos
- Rastreamento de domínios visitados em navegadores
- Relatórios detalhados (diário, semanal e mensal)
- Visualização de gráficos interativos
- Armazenamento local de dados
- Interface moderna com Tailwind CSS
- Dados persistentes por data

## Requisitos

- Node.js 14.0 ou superior
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/Tempestugo/devbalance.git
cd devbalance
```

2. Instale as dependências:
```bash
npm install
```

3. Execute a aplicação:
```bash
npm start
```

## Estrutura do Projeto

```
devbalance/
├── src/
│   ├── main.js           # Arquivo principal do Electron
│   ├── renderer.js       # Lógica da interface frontend
│   ├── database.js       # Gerenciamento de dados
│   ├── monitor.js        # Monitor de atividades
│   └── index.html        # Interface HTML
├── package.json
├── README.md
└── LICENSE
```

## Como Funciona

### Monitoramento
A aplicação monitora a janela ativa do seu sistema a cada 2 segundos, capturando:
- Nome da aplicação
- Título da janela
- Domínio (para navegadores)
- Duração da sessão

### Armazenamento
Os dados são armazenados em arquivos JSON locais por data, organizados em:
```
~/.config/devbalance/activity-data/
├── 2025-12-25.json
├── 2025-12-26.json
└── 2025-12-27.json
```

### Análise
A interface oferece 4 visualizações:
- **Monitor**: Atividade em tempo real
- **Diário**: Histórico por dia
- **Semanal**: Gráfico de barras com tendência
- **Mensal**: Gráfico de linha com escala fixa (12 horas)

## Tecnologias Utilizadas

- **Electron** - Framework para aplicações desktop
- **Node.js** - Runtime JavaScript
- **Tailwind CSS** - Framework CSS
- **Chart.js** - Biblioteca de gráficos
- **Plus Jakarta Sans** - Fonte tipográfica

## APIs Utilizadas

- `active-win` - Detecção de janela ativa
- `fs` - Sistema de arquivos Node.js

## Configuração de CSP

A aplicação utiliza Content Security Policy para segurança. Os seguintes domínios são permitidos:
- cdn.tailwindcss.com (Tailwind CSS)
- cdnjs.cloudflare.com (Chart.js)
- fonts.googleapis.com e fonts.gstatic.com (Fontes)
- icons.duckduckgo.com (Ícones de domínios)
- cdn.jsdelivr.net (Ícones de aplicações)

## Licença

Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.

## Autor

Desenvolvido por Tempestugo

## Suporte

Para reportar bugs ou sugerir melhorias, abra uma issue no repositório.
