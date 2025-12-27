# DevBalance PRO

Aplicação desktop em Electron para monitorar o tempo de uso de aplicações e sites no sistema operacional.

---

## Descrição

O DevBalance PRO registra periodicamente a janela ativa do sistema, identifica o processo em execução e armazena o tempo de uso em arquivos JSON locais.  
Os dados são utilizados para gerar gráficos simples de uso diário, semanal e mensal.
## Screenshot

![Tela principal da aplicação](https://github.com/user-attachments/assets/3cbeac53-4744-4049-acad-0c351cf2f0ae)

---

## Tecnologias

- Electron
- Node.js
- active-win
- Chart.js
- Tailwind CSS

---

## Requisitos

- Node.js 16 ou superior
- npm

---

## Instalação

```bash
git clone https://github.com/Tempestugo/devbalance-pro.git
cd devbalance-pro
npm install
Execução
bash
Copiar código
npm start
Build (Windows)
bash
Copiar código
npm run build:win
O executável será gerado na pasta dist.

Estrutura do Projeto
text
Copiar código
devbalance-pro/
├── build/
├── src/
│   ├── main.js
│   ├── monitor.js
│   ├── database.js
│   ├── preload.js
│   ├── renderer.js
│   └── index.html
└── package.json
Funcionamento Básico
A cada 2 segundos a aplicação verifica a janela ativa.






O nome do processo e o título da janela são capturados via active-win.

Os dados são persistidos localmente em arquivos JSON organizados por data.

Segurança
A aplicação utiliza Content Security Policy para limitar o carregamento de recursos externos necessários ao funcionamento da interface.

Autor
Tempestugo
