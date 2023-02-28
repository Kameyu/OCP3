// Avant d'afficher la page principale, on fetch les travaux de l'API
async function getWorks() {
	const rsp = await fetch("http://localhost:5678/api/works");
	return rsp.json();
}

async function getCategories() {
	const rsp = await fetch("http://localhost:5678/api/categories");
	return rsp.json();
}

function isLoggedIn() {
	const auth = JSON.parse(localStorage.getItem("auth"));
	if (!auth || !auth.token || !auth.userId)
		return false;
	return true;
}

function logOut() {
	if (isLoggedIn()){
		localStorage.removeItem("auth");
		document.location.href = "index.html";
	}
}

// Fonction qui affiche la liste des travaux en cours, avec ou sans filtre
function printWorks(workList, where) {
	for (let i = 0; i < workList.length; i++) {
		const fig = document.createElement("figure");
		fig.dataset.id = i;
		
		const img = document.createElement("img");
		const cap = document.createElement("figcaption");
		
		img.src = workList[i].imageUrl;
		cap.innerText = workList[i].title;
		
		fig.appendChild(img);
		fig.appendChild(cap);
		where.appendChild(fig);
	}
}

// On enregistre les travaux récupérés pour les traiter
const works = await getWorks();
const cats = await getCategories();
const gallery = document.querySelector(".gallery");

// Par défaut, on génère la liste complète des travaux
printWorks(works, gallery);
	
// On prépare une liste pour les filtres par catégorie
const list = document.createElement("ul");
list.className = "filterList";

// On crée l'élément "Tous" de la liste avant les catégories
let li = document.createElement("li");
let button = document.createElement("button");
let buttonList = [];

// On crée les catégories dynamiquement ainsi que leurs listeners
for (let i = 0; i < cats.length + 1; i++) {
	li = document.createElement("li");
	button = document.createElement("button");
	button.className = "unpressed";

	if (i == 0) { // Le bouton "Tous" n'est pas dans la liste des catégories
		button.innerHTML = "Tous";
		button.dataset.id = "0"; // inutile de concaténer i, on connait sa valeur
		button.className = "pressed"; // à la création, il est forcément "pressed"
	}
	else {
		button.innerHTML = cats[i - 1].name;
		button.dataset.id = i;
	}

	// Besoin ultérieur
	buttonList.push(button);

	li.appendChild(button);
	list.appendChild(li);
}

// on ajoute les listeners de nos buttons
for (let pressedButton of buttonList)
{
	pressedButton.addEventListener("click", function() {
		const pressedID = pressedButton.dataset.id;
		const filteredList = works.filter(function (work) {
			return work.categoryId == pressedID; // catégorie == 0, 1, 2, etc...
		});
		gallery.innerHTML = "";
		if (pressedID == "0") // Si c'est "Tous", on affiche la liste entière
			printWorks(works, gallery);
		else // Sinon on affiche la liste filtrée par id
			printWorks(filteredList, gallery);

		// on affiche le bouton comme "appuyé"
		for (let btn of buttonList) {
			if (btn.dataset.id == pressedID)
				btn.className = "pressed";
			else if (btn != undefined) // Juste au cas où
				btn.className = "unpressed";
		}
	});
}
	
// On ajoute les filtres juste au dessus de la gallerie
gallery.parentNode.insertBefore(list, gallery);

let modal = null;

function openModal(e) {
	e.preventDefault();
	modal = document.querySelector(e.target.getAttribute("href"));
	modal.style.display = "flex";
	modal.removeAttribute("aria-hidden");
	modal.setAttribute("aria-modal", true);
	window.addEventListener("keydown", hideModal);
	modal.addEventListener("click", hideModal);
}

function hideModal(e) {
	if (modal == null)
		return;

	// Fermer modale si clic background, clic bouton fermer ou appuyer Echap
	if ((e.type === "keydown" && (e.key === "Escape" || e.key === "Esc")) ||
		e.target.id == "closeButton" || e.target.id == "modalWindow") {

		window.setTimeout(function() {
			modal.style.display = "none";
			modal = null;
		}, 500);

		modal.setAttribute("aria-hidden", true);
		modal.removeAttribute("aria-modal");
		document.getElementById("closeButton").removeEventListener("click", hideModal);
	}
	else
		return;
}

// On vérifie si l'utilisateur est connecté
if (isLoggedIn()) {
	// Ajout de la bannière
	const banner = document.createElement("div");
	banner.className = "banner";
	
	const editMode = document.createElement("p");

	const faIcon = document.createElement("i");
	faIcon.className = "fa-regular fa-pen-to-square";
	editMode.appendChild(faIcon);
	editMode.innerHTML += "Mode édition";

	const publishButton = document.createElement("button");
	publishButton.innerHTML = "publier les changements";

	banner.appendChild(editMode);
	banner.appendChild(publishButton);

	const header = document.querySelector("body");
	header.parentNode.insertBefore(banner, header);

	// On change le bouton "login" par "logout"
	const loginButton = document.getElementById("loginButton");
	loginButton.innerHTML = "logout";
	loginButton.href = "#"; // On ne redirige pas sur la page login
	loginButton.addEventListener('click', logOut);

	// On ajoute les boutons modifier
	const intro = document.querySelector("#introduction figure");
	const editIntro = document.createElement("p");
	editIntro.className = "editButton";
	editIntro.appendChild(faIcon); // on recycle nos elems pré-existants car identiques
	editIntro.innerHTML += "modifier";
	intro.appendChild(editIntro);

	const title = document.querySelector("#portfolio h2");
	const editWorks = document.createElement("a");
	editWorks.className = "editButton";
	editWorks.href = "#modalWindow";
	editWorks.appendChild(faIcon); // on recycle ici aussi
	editWorks.innerHTML += "modifier";
	title.appendChild(editWorks);
	
	// On initialise notre modale
	editWorks.addEventListener("click", openModal);

	// On remplit notre modale pour la première fois
	const modalWorks = Array.from(works); // On copie les travaux "par défaut"
	modalWorks.forEach(element => { element.title = "éditer" });
	printWorks(modalWorks, document.querySelector(".modal-main"));

	const modalWrapper = document.querySelector(".modal-wrapper");
	const addButton = document.createElement("button");
	addButton.innerHTML = "Ajouter une photo"
	addButton.className = "pressed";

	const deleteGallery = document.createElement("a")

	// on empêche que le clic sur le lien remonte la page
	deleteGallery.addEventListener("click", function(e) { e.preventDefault() })

	deleteGallery.innerHTML = "Supprimer la gallerie";
	deleteGallery.href = "#";

	modalWrapper.appendChild(addButton);
	modalWrapper.appendChild(deleteGallery);

	// Ajouter icônes move/delete


	/* TODO: Ajouter modale "ajout projet"
		-> backup page préc. ?
		b = Object.assign({}, a)
	*/

	// TODO: supprimer projet
}