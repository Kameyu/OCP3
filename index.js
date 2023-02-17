// Avant d'afficher la page principale, on fetch les travaux de l'API
async function getWorks() {
	const rsp = await fetch("http://localhost:5678/api/works");
	return rsp.json();
}

async function getCategories() {
	const rsp = await fetch("http://localhost:5678/api/categories");
	return rsp.json();
}

// Fonction qui affiche la liste des travaux en cours, avec ou sans filtre
function printWorks(workList) {
	const gallery = document.querySelector(".gallery");
	for (let i = 0; i < workList.length; i++) {
		const fig = document.createElement("figure");
		const img = document.createElement("img");
		const cap = document.createElement("figcaption");
		
		img.src = workList[i].imageUrl;
		cap.innerText = workList[i].title;
		
		fig.appendChild(img);
		fig.appendChild(cap);
		gallery.appendChild(fig);
	}
}

// On enregistre les travaux récupérés pour les traiter
const works = await getWorks();
const cats = await getCategories();
const gallery = document.querySelector(".gallery");

// Par défaut, on génère la liste complète des travaux
printWorks(works);
	
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
for (let i = 0; i < buttonList.length; i++)
{
	const button = buttonList[i];
	button.addEventListener("click", function() {
		const buttonID = parseInt(button.dataset.id);
		const filteredList = works.filter(function (work) {
			return work.categoryId == buttonID; // catégorie == 0, 1, 2, etc...
		});
		gallery.innerHTML = "";
		if (buttonID == 0) // Si c'est "Tous", on affiche la liste entière
			printWorks(works);
		else // Sinon on affiche la liste filtrée par id
			printWorks(filteredList);

		// on affiche le bouton comme "appuyé"
		for (let j = 0; j < buttonList.length; j++) {
			if (buttonID == j)
				button.className = "pressed";
			else
				buttonList[j].className = "unpressed";
		}
	});
}
	
// On ajoute les filtres juste au dessus de la gallerie
gallery.parentNode.insertBefore(list, gallery);