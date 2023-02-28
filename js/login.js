async function authUser(authInfo) {
	const rsp = await fetch("http://localhost:5678/api/users/login",
	{
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(authInfo)
	});
	return rsp;
}

function printInfo(where, msg, isError) {
	// Si le message n'est pas affiché, on le crée
	let errorElem;
	if (!(errorElem = document.getElementById("info")))
	{
		errorElem = document.createElement("p");
		errorElem.id = "info";
		errorElem.className = isError ? "error" : "success";
	}
	errorElem.innerHTML = msg;
	where.parentNode.insertBefore(errorElem, where);
}

const loginButton = document.getElementById("connect");
loginButton.addEventListener("click", async function (e) {
	e.preventDefault(); // On empêche l'envoi du formulaire
	
	// on récupère les identifiants
	const authInfo = {
		"email": document.getElementById("mail").value,
		"password": document.getElementById("pw").value
	}

	// On fait une requête API pour vérifier les identifiants
	const response = await authUser(authInfo);
	const content = await response.json();

	// On traite la réponse de l'API
	switch (response.status) {
	case 404:
	case 401:
		printInfo(document.querySelector("#login form"),
			'Erreur dans l’identifiant ou le mot de passe', true);
		break;
	case 200: // Identifiants valides
		printInfo(document.querySelector("#login form"),
		'Vous êtes connecté(e), redirection...', false);
		// On garde en mémoire le token
		localStorage.setItem("auth", JSON.stringify(content));
		// Une fois le token enregistré, on redirige l'utilisateur à l'accueil
		document.location.href = "index.html";
		break;
	default:
		printInfo(document.querySelector("#login form"),
			'Erreur inconnue', true);
		break;
	};
});