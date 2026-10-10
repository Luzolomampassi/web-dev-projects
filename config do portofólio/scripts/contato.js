const formContato = document.getElementById('form-contato');

if (formContato) {
    const feedbackContato = document.getElementById('contact-feedback');
    const botaoContato = formContato.querySelector('button[type="submit"]');

    formContato.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!formContato.reportValidity() || botaoContato.disabled) return;

        botaoContato.disabled = true;
        feedbackContato.textContent = 'A enviar a mensagem…';

        try {
            const response = await fetch(formContato.action, {
                method: 'POST',
                body: new FormData(formContato),
                headers: { Accept: 'application/json' }
            });
            if (!response.headers.get('content-type')?.includes('application/json')) {
                feedbackContato.textContent = `O servidor devolveu uma página inesperada (HTTP ${response.status}). Confirme a URL do projeto e que o Apache está ativo no XAMPP.`;
                feedbackContato.dataset.state = 'error';
                return;
            }
            const result = await response.json();
            feedbackContato.textContent = result.message || 'Não foi possível processar o pedido.';
            feedbackContato.dataset.state = result.success ? 'success' : 'error';
            if (result.success) formContato.reset();
        } catch {
            feedbackContato.textContent = 'Não foi possível contactar o servidor. Inicie o Apache no XAMPP e abra o portfólio por http://localhost, não diretamente pelo ficheiro HTML.';
            feedbackContato.dataset.state = 'error';
        } finally {
            botaoContato.disabled = false;
        }
    });
}
