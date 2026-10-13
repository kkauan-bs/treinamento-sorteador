# Explicação do Sorteador de times

## Visão geral

A aplicação é um sorteador de times com interface web, modo claro/escuro, configuração de participantes e times, persistência de sorteios e área administrativa protegida.

## Organização dos arquivos

- `sorteio-times.html`: estrutura da interface principal e formulário de login administrativo.
- `historico-sorteios.html`: estrutura da página administrativa de histórico.
- `assets/css/sorteio-times.css`: estilos da página principal.
- `assets/css/historico-sorteios.css`: estilos da página de histórico.
- `assets/js/sorteio-times.js`: lógica de participantes, times, sorteio, alternância de tema, login e envio dos resultados.
- `assets/js/historico-sorteios.js`: alternância de tema e carregamento do histórico.
- `../server.js`: servidor Node.js, autenticação, API e persistência do histórico.
- `../package.json`: dependências e comandos do projeto.
- `../data/sorteios.db`: banco SQLite criado automaticamente ao iniciar o servidor.

## Sorteio

A página começa com seis caixas de participantes. É possível adicionar até 40 participantes ou remover caixas até o mínimo de dois. Campos vazios são ignorados, permitindo sortear somente com os nomes preenchidos.

Os times podem ser adicionados, removidos e renomeados. Ao sortear, os nomes preenchidos são embaralhados com Fisher–Yates e distribuídos igualmente entre todos os times. A aplicação exibe avisos visuais quando não há participantes ou quando a divisão não pode ser feita igualmente.

Após o sorteio, os cards dos times recebem uma animação de entrada e os participantes aparecem com um efeito sequencial. O resultado é enviado à API para registro no histórico.

## Interface e acessibilidade

A interface utiliza layout responsivo, cards, controles visuais e suporte a telas menores. O modo escuro é salvo no `localStorage`; a lua é exibida no modo claro e o sol no modo escuro. Mensagens de validação usam elementos visuais e `role="alert"` quando apropriado.

O ícone de usuário no canto superior esquerdo abre o login administrativo. Cada abertura limpa os campos e inicia o formulário como uma nova tentativa. A janela possui botão de fechamento, foco inicial no usuário e animações suaves.

## Autenticação e histórico

O login usa as credenciais iniciais `admin` / `admin123`. O servidor cria a sessão em cookie HTTP-only e redireciona o administrador para `historico-sorteios.html` após a autenticação.

A página de histórico mantém a identidade visual do sorteador, lista data e hora de cada sorteio, nomes dos times e seus participantes, além de oferecer um link de retorno ao sorteador. A API exige sessão válida para consultar os registros.

## Execução

O projeto exige Node.js 22.13 ou superior e deve ser executado pelo servidor HTTP,
não diretamente via `file://`. Na raiz do projeto:

```powershell
npm install
npm run dev
```

O comando `npm start` inicia o servidor sem reinicialização automática. Depois,
acesse `http://localhost:3000/sorteio-times.html` ou
`http://localhost:3000/`. O banco `data/sorteios.db` é criado ou atualizado
automaticamente pelo servidor.

O login inicial da área administrativa é `admin` / `admin123`. Para configurar
outras credenciais no PowerShell, defina as variáveis de ambiente antes de
iniciar o servidor:

```powershell
$env:ADMIN_USER = "seu-usuario"
$env:ADMIN_PASSWORD = "uma-senha-forte"
npm run dev
```

Em produção, configure credenciais próprias, `NODE_ENV=production` e utilize
HTTPS. Nesse modo, o cookie da sessão é enviado somente por conexões seguras.
