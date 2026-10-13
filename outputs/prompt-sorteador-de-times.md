# Prompts principais: Sorteador de times

## 1. Sorteador inicial

Crie um sistema simples que gere dois times aleatoriamente a partir dos nomes informados. Os times devem ter a mesma quantidade de pessoas.

A interface deve ter aparência simples, campos editáveis para os participantes e um botão para sortear quantas vezes quiser. Use HTML, CSS e JavaScript.

## 2. Participantes e times configuráveis

Permita adicionar e remover participantes. A página deve começar com seis caixas de participantes e aceitar campos vazios, ignorando-os no sorteio. Exiba um aviso visual quando não houver participantes ou quando a quantidade preenchida não puder ser distribuída igualmente.

Permita adicionar times, excluir times e renomear seus nomes. O sorteio deve distribuir os participantes igualmente entre todos os times existentes.

## 3. Aparência e modo escuro

Adicione um modo escuro com alternância persistente entre as visitas. A escolha deve ser salva no navegador e todos os elementos da interface devem manter bom contraste. Use uma lua no modo claro e um sol no modo escuro como ícones do alternador.

## 4. Histórico administrativo

Adicione persistência dos sorteios usando um backend Node.js com SQLite. Cada sorteio deve registrar a data e hora, os nomes dos times e os participantes de cada time.

Crie uma área administrativa discreta, acessível por um ícone de usuário no canto superior esquerdo. Proteja o acesso com login usando as credenciais iniciais `admin` / `admin123`, sessão via cookie seguro e uma página separada para consultar o histórico.

A página principal deve permanecer focada apenas no sorteador para usuários comuns. Após o login, redirecione para uma página administrativa com a mesma identidade visual, listando os sorteios realizados e oferecendo uma opção para voltar ao sorteador.

## 5. Experiência visual

Adicione efeitos sutis para deixar a experiência mais agradável: animação ao abrir o login administrativo, foco visual nos campos, limpeza automática do formulário ao abrir o login e animação ao sortear os times.

## Requisitos de execução

A aplicação deve ser executada por um servidor HTTP, e não diretamente via `file://`, para que o login, a persistência e o histórico funcionem corretamente. O projeto deve incluir instruções para instalar as dependências e iniciar o servidor.


