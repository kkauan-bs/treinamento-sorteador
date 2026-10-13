# Prompts principais: Sorteador de times

## 1. Sorteador inicial

Crie um sistema simples que gere dois times aleatoriamente a partir dos nomes informados. Os times devem ter a mesma quantidade de pessoas.

A interface deve ter aparência simples, campos editáveis para os participantes e um botão para sortear quantas vezes quiser. Use HTML, CSS e JavaScript.

## 2. Participantes e times configuráveis

Permita adicionar e remover participantes. A página deve começar com seis caixas de participantes e aceitar campos vazios, ignorando-os no sorteio. Exiba um aviso visual quando não houver participantes ou quando a quantidade preenchida não puder ser distribuída igualmente.

Permita adicionar times, excluir times e renomear seus nomes. O sorteio deve distribuir os participantes igualmente entre todos os times existentes.

## 3. Aparência e modo escuro

Adicione um modo escuro com alternância persistente entre as visitas. A escolha deve ser salva no navegador e todos os elementos da interface devem manter bom contraste. Use uma lua no modo claro e um sol no modo escuro como ícones do alternador.

## 4. Histórico administrativo e autenticação

Adicione persistência dos sorteios usando um backend Node.js com SQLite. Cada sorteio deve registrar a data e hora, os nomes dos times e os participantes de cada time. Novos sorteios continuam podendo ser registrados pelo fluxo público do sorteador.

Crie uma área administrativa discreta, acessível por um ícone de usuário no canto superior esquerdo. Valide as credenciais no backend usando `bcryptjs`. No primeiro uso local, aceite `admin` / `admin123`, mas permita configurar o usuário e a senha por variáveis de ambiente; exija credenciais fortes em produção.

Implemente sessões autenticadas reais com cookie `HttpOnly`, `SameSite=Lax` e `Secure` em produção. Guarde no SQLite o hash do token de sessão, nunca o token em texto puro, para que a sessão continue válida entre abas e após reiniciar o servidor. Expire a sessão após 30 minutos de inatividade, renovando esse prazo enquanto houver atividade autenticada. A sessão só deve terminar por logout, expiração ou cookie/token inválido.

Proteja no backend a página administrativa e todas as APIs de consulta e gerenciamento; não confie apenas em controles ocultos no frontend. Sem sessão válida, redirecione o acesso à página para o sorteador e apresente o login. Disponibilize um endpoint para consultar/renovar o estado da sessão e outro para logout, invalidando a sessão no banco e apagando o cookie.

Após autenticar, abra a página do histórico em uma nova aba com proteção equivalente a `target="_blank"` e `rel="noopener noreferrer"`; não solicite login novamente se já houver sessão válida. Mostre no sorteador quando o administrador está conectado e exiba o botão “Sair” somente durante uma sessão autenticada. Disponibilize logout também na página administrativa. Mantenha a interface do sorteador acessível a usuários comuns.

Na página administrativa, liste e permita visualizar os sorteios, com data/hora, times e participantes. Permita excluir um sorteio após confirmação. A exclusão deve ser validada e autorizada no backend, usar consulta parametrizada, remover o registro e seus dados relacionados no SQLite, atualizar a lista sem recarregar a página e informar sucesso ou erro. Não é necessário editar um resultado de sorteio já realizado.

## 5. Experiência visual

Adicione efeitos sutis para deixar a experiência mais agradável: animação ao abrir o login administrativo, foco visual nos campos, limpeza automática do formulário ao abrir o login e animação ao sortear os times.

## Requisitos de execução

A aplicação deve ser executada por um servidor HTTP, e não diretamente via `file://`, para que o login, a persistência e o histórico funcionem corretamente. O projeto deve incluir instruções para instalar as dependências e iniciar o servidor.

