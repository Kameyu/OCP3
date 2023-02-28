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
		fig.dataset.id = workList[i].id;
		
		const img = document.createElement("img");
		const cap = document.createElement("figcaption");
		
		img.src = workList[i].imageUrl;
		cap.innerText = workList[i].title;
		
		/* Gestion modale */
		if (where.className == "modal-main") {
			// Dans la modale, le figcaption doit afficher "éditer" et non le titre
			cap.innerText = "éditer";

			const container = document.createElement("div");
			container.className = "options";

			const del = document.createElement("button");
			const move = document.createElement("button");

			const delIcon = document.createElement("i");
			delIcon.className = "fa-solid fa-trash-can";
			
			const moveIcon = document.createElement("i");
			moveIcon.className = "fa-solid fa-up-down-left-right";

			del.className = "optionsButton";
			del.id = "del";

			move.className = "optionsButton";
			move.id = "move";

			del.addEventListener("click", askDeleteWork);

			del.appendChild(delIcon);
			move.appendChild(moveIcon);

			container.appendChild(move);
			container.appendChild(del);

			fig.appendChild(container);
		}

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

function askDeleteWork(e) {
	// On ne fait rien si le prompt est déjà ouvert
	if (document.querySelector(".promptContainer"))
		return;

	// 			  #del	  .options	 <figure>
	const fig = e.target.parentNode.parentNode;

	const promptContainer = document.createElement("div");
	promptContainer.className = "promptContainer";

	const confirm = document.createElement("p");
	confirm.innerHTML = "Confirmer ?";

	const yes = document.createElement("button");
	const no = document.createElement("button");
	yes.id = "yes";
	no.id = "no";
	yes.innerHTML = "Oui";
	no.innerHTML = "Non";

	yes.addEventListener("click", function(e) {deleteWork(e, parseInt(fig.dataset.id))});
	no.addEventListener("click", function(e) {
		e.preventDefault();
		// On rétablit le clic du bouton #del
		e.target.addEventListener("click", askDeleteWork);
		fig.removeChild(promptContainer);
	});

	promptContainer.appendChild(confirm);
	promptContainer.appendChild(yes);
	promptContainer.appendChild(no);

	fig.appendChild(promptContainer);
}

async function queryDeleteWork(workId) {
	const token = JSON.parse(localStorage.getItem("auth")).token;
	const rsp = await fetch("http://localhost:5678/api/works/"+workId,
	{
		method: "DELETE",
		headers: { "Authorization": "Bearer "+ token }
	});
	return rsp;
}

async function deleteWork(e, workId) {
	if (e.target.id != "yes") {
		return;
	}

	const response = await queryDeleteWork(workId);

	// On traite la réponse de l'API
	switch (response.status) {
		case 200:
		case 204:
			// On recherche l'index du work dans la liste des works
			for (const work of works) {
				if (work.id == workId)
				works.splice(works.indexOf(work), 1); // on supprime intéractivement
			}
			
			// on actualise les galleries
			const mainGallery = document.querySelector("#portfolio .gallery");
			const modalGallery = document.querySelector(".modal-main");
			
			mainGallery.innerHTML = "";
			modalGallery.innerHTML = "";
			
			printWorks(works, mainGallery);
			printWorks(works, modalGallery);
			break;
		default:
			return;
	}
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
	printWorks(works, document.querySelector(".modal-main"));

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

	/* TODO: Ajouter modale "ajout projet"
		-> backup page préc. ?
		b = Object.assign({}, a)
	*/

	// TODO: supprimer projet
}