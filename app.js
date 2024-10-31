// Inicializar el mapa centrado en Valencia
const map = L.map('map').setView([39.4699, -0.3763], 10); // Centro en Valencia

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

// Iconos personalizados para los marcadores
const icons = {
    "Zona Afectada": new L.Icon({
        iconUrl: 'icons/red-dot.png', // Ruta local a los iconos
        iconSize: [32, 32]
    }),
    "Punto de Ayuda": new L.Icon({
        iconUrl: 'icons/green-dot.png',
        iconSize: [32, 32]
    }),
    "Desaparecidos": new L.Icon({
        iconUrl: 'icons/orange-dot.png',
        iconSize: [32, 32]
    }),
    "Grupo de Voluntarios": new L.Icon({
        iconUrl: 'icons/blue-dot.png',
        iconSize: [32, 32]
    }),
    "preliminar": new L.Icon({
        iconUrl: 'icons/gray-dot.png',
        iconSize: [32, 32]
    })
};

let tempMarker = null; // Marcador preliminar
let selectedMarkerId = null; // ID del marcador seleccionado para modificación
const markers = {}; // Almacenar marcadores con sus IDs para fácil acceso

// Función para cargar puntos de Firestore al iniciar la página
function cargarPuntos() {
    db.collection("reportes").get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            agregarMarcadorPermanente(data.lat, data.lng, data.tipo, doc.id);
        });
    }).catch((error) => {
        console.error("Error al cargar puntos: ", error);
    });
}

// Función para agregar un marcador preliminar al hacer clic en el mapa
map.on('click', function(e) {
    resetFormularioDetalles();
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    // Eliminar marcador preliminar anterior, si existe
    if (tempMarker) {
        map.removeLayer(tempMarker);
    }

    // Crear un nuevo marcador preliminar en la ubicación seleccionada
    tempMarker = L.marker([lat, lng], { icon: icons["preliminar"] }).addTo(map);
});

// Función para limpiar los campos del formulario de detalles
function resetFormularioDetalles() {
    const campos = [
        "direccion", "comentarios", "direccionAyuda", "necesidadesAyuda",
        "horarioAyuda", "comentariosAyuda", "nombre", "descripcion",
        "sexo", "comentariosDesaparecido", "ubicacion", "organizacion",
        "hora", "actividad", "comentariosVoluntarios"
    ];
    campos.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento) elemento.value = '';
    });
    selectedMarkerId = null;
    document.getElementById("botonModificar").style.display = "none";
    document.getElementById("botonAgregar").style.display = "inline";
    document.getElementById("botonEliminar").style.display = "none";

    // Eliminar el marcador preliminar si existe
    if (tempMarker) {
        map.removeLayer(tempMarker);
        tempMarker = null;
    }
}

// Función para agregar un marcador permanente al mapa y guardarlo en Firestore
function agregarMarcadorPermanente(lat, lng, tipo, id) {
    const marker = L.marker([lat, lng], { icon: icons[tipo] }).addTo(map);
    markers[id] = marker;

    marker.on("click", () => {
        mostrarDetalles(id);
    });
}

// Función para guardar un marcador preliminar como permanente
function agregarReporte() {
    if (!tempMarker) return;

    const lat = tempMarker.getLatLng().lat;
    const lng = tempMarker.getLatLng().lng;
    const tipo = document.getElementById("markerType").value;
    const data = { lat, lng, tipo };

    // Recopilar detalles en función del tipo de marcador
    if (tipo === "Zona Afectada") {
        data.direccion = document.getElementById("direccion").value || '';
        data.comentarios = document.getElementById("comentarios").value || '';
    } else if (tipo === "Punto de Ayuda") {
        data.direccion = document.getElementById("direccionAyuda").value || '';
        data.necesidades = document.getElementById("necesidadesAyuda").value || '';
        data.horario = document.getElementById("horarioAyuda").value || '';
        data.comentarios = document.getElementById("comentariosAyuda").value || '';
    } else if (tipo === "Desaparecidos") {
        data.nombre = document.getElementById("nombre").value || '';
        data.descripcion = document.getElementById("descripcion").value || '';
        data.sexo = document.getElementById("sexo").value || '';
        data.comentarios = document.getElementById("comentariosDesaparecido").value || '';
    } else if (tipo === "Grupo de Voluntarios") {
        data.ubicacion = document.getElementById("ubicacion").value || '';
        data.organizacion = document.getElementById("organizacion").value || '';
        data.hora = document.getElementById("hora").value || '';
        data.actividad = document.getElementById("actividad").value || '';
        data.comentarios = document.getElementById("comentariosVoluntarios").value || '';
    }

    // Guardar en Firestore y añadir como marcador permanente
    db.collection("reportes").add(data)
    .then((docRef) => {
        console.log("Reporte agregado con ID: ", docRef.id);
        agregarMarcadorPermanente(lat, lng, tipo, docRef.id);
        map.removeLayer(tempMarker);
        tempMarker = null;
        resetFormularioDetalles();
    })
    .catch((error) => {
        console.error("Error al agregar el reporte: ", error);
    });
}

// Función para mostrar detalles de un marcador existente y habilitar botones "Modificar" y "Eliminar"
function mostrarDetalles(id) {
    resetFormularioDetalles();
    selectedMarkerId = id;

    db.collection("reportes").doc(id).get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const tipo = data.tipo;

            document.getElementById("markerType").value = tipo;

            // Rellenar campos de acuerdo al tipo de marcador
            if (tipo === "Zona Afectada") {
                document.getElementById("direccion").value = data.direccion || '';
                document.getElementById("comentarios").value = data.comentarios || '';
            } else if (tipo === "Punto de Ayuda") {
                document.getElementById("direccionAyuda").value = data.direccion || '';
                document.getElementById("necesidadesAyuda").value = data.necesidades || '';
                document.getElementById("horarioAyuda").value = data.horario || '';
                document.getElementById("comentariosAyuda").value = data.comentarios || '';
            } else if (tipo === "Desaparecidos") {
                document.getElementById("nombre").value = data.nombre || '';
                document.getElementById("descripcion").value = data.descripcion || '';
                document.getElementById("sexo").value = data.sexo || '';
                document.getElementById("comentariosDesaparecido").value = data.comentarios || '';
            } else if (tipo === "Grupo de Voluntarios") {
                document.getElementById("ubicacion").value = data.ubicacion || '';
                document.getElementById("organizacion").value = data.organizacion || '';
                document.getElementById("hora").value = data.hora || '';
                document.getElementById("actividad").value = data.actividad || '';
                document.getElementById("comentariosVoluntarios").value = data.comentarios || '';
            }

            // Habilitar botones "Modificar" y "Eliminar"
            document.getElementById("botonModificar").style.display = "inline";
            document.getElementById("botonEliminar").style.display = "inline";
            document.getElementById("botonAgregar").style.display = "none";

            // Eliminar el marcador preliminar si existe
            if (tempMarker) {
                map.removeLayer(tempMarker);
                tempMarker = null;
            }
        }
    }).catch((error) => {
        console.error("Error al cargar detalles del reporte: ", error);
    });
}

// Función para eliminar todos los puntos de Firestore y del mapa
function eliminarTodosLosPuntos() {
    if (confirm("¿Estás seguro de que deseas eliminar todos los puntos?")) {
        db.collection("reportes").get().then((querySnapshot) => {
            const batch = db.batch();
            querySnapshot.forEach((doc) => {
                batch.delete(db.collection("reportes").doc(doc.id));
            });
            return batch.commit();
        }).then(() => {
            console.log("Todos los puntos en Firestore han sido eliminados.");
            Object.values(markers).forEach(marker => map.removeLayer(marker));
            Object.keys(markers).forEach(key => delete markers[key]);
            resetFormularioDetalles();
        }).catch((error) => {
            console.error("Error al eliminar los puntos de Firestore: ", error);
        });
    }
}
// Función para modificar un reporte existente
function modificarReporte() {
    if (!selectedMarkerId || !markers[selectedMarkerId]) return;

    const tipo = document.getElementById("markerType").value;
    const data = { tipo };

    // Recopilar detalles en función del tipo de marcador
    if (tipo === "Zona Afectada") {
        data.direccion = document.getElementById("direccion").value || '';
        data.comentarios = document.getElementById("comentarios").value || '';
    } else if (tipo === "Punto de Ayuda") {
        data.direccion = document.getElementById("direccionAyuda").value || '';
        data.necesidades = document.getElementById("necesidadesAyuda").value || '';
        data.horario = document.getElementById("horarioAyuda").value || '';
        data.comentarios = document.getElementById("comentariosAyuda").value || '';
    } else if (tipo === "Desaparecidos") {
        data.nombre = document.getElementById("nombre").value || '';
        data.descripcion = document.getElementById("descripcion").value || '';
        data.sexo = document.getElementById("sexo").value || '';
        data.comentarios = document.getElementById("comentariosDesaparecido").value || '';
    } else if (tipo === "Grupo de Voluntarios") {
        data.ubicacion = document.getElementById("ubicacion").value || '';
        data.organizacion = document.getElementById("organizacion").value || '';
        data.hora = document.getElementById("hora").value || '';
        data.actividad = document.getElementById("actividad").value || '';
        data.comentarios = document.getElementById("comentariosVoluntarios").value || '';
    }

    // Obtener las coordenadas actuales del marcador en el mapa
    const latLng = markers[selectedMarkerId].getLatLng();
    data.lat = latLng.lat;
    data.lng = latLng.lng;

    // Actualizar en Firestore
    db.collection("reportes").doc(selectedMarkerId).update(data)
    .then(() => {
        console.log("Reporte actualizado correctamente");

        // Actualizar el icono del marcador en el mapa
        if (markers[selectedMarkerId]) {
            map.removeLayer(markers[selectedMarkerId]);
        }
        agregarMarcadorPermanente(latLng.lat, latLng.lng, tipo, selectedMarkerId);
        resetFormularioDetalles();
    })
    .catch((error) => {
        console.error("Error al actualizar el reporte: ", error);
    });
}


// Función para eliminar un reporte específico
function eliminarReporte() {
    if (!selectedMarkerId) return;

    // Eliminar de Firestore
    db.collection("reportes").doc(selectedMarkerId).delete()
    .then(() => {
        console.log("Reporte eliminado correctamente");

        // Eliminar el marcador del mapa
        if (markers[selectedMarkerId]) {
            map.removeLayer(markers[selectedMarkerId]);
            delete markers[selectedMarkerId];
        }
        resetFormularioDetalles();
    })
    .catch((error) => {
        console.error("Error al eliminar el reporte: ", error);
    });
}


// Cargar puntos al iniciar la página
cargarPuntos();
