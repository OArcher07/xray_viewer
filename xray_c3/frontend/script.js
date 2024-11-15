document.addEventListener("DOMContentLoaded", function () {
  const xrayImage = document.getElementById("xrayImage");
  const xrayContainer = document.getElementById("xrayContainer");
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const resetBtn = document.getElementById("reset");
  const annotateBtn = document.getElementById("annotate");
  const contrastSlider = document.getElementById("contrast");
  const brightnessSlider = document.getElementById("brightness");
  const contrastValue = document.getElementById("contrast-value");
  const brightnessValue = document.getElementById("brightness-value");
  const patientNameElement = document.getElementById("patient-name");
  const patientDobElement = document.getElementById("patient-dob");
  const patientGenderElement = document.getElementById("patient-gender");
  const patientMedicalHistoryElement = document.getElementById(
    "patient-medical-history"
  );
  const patientSelect = document.getElementById("patient-select");

  let scale = 1;
  let isAnnotating = false;

  // Fetch list of patients
  async function fetchPatientList() {
    console.log("Fetching Patient List...");
    try {
      const response = await fetch("http://localhost:3000/api/patients");
      if (!response.ok) {
        throw new Error("Failed to fetch patient list");
      }
      const patients = await response.json();
      populatePatientDropdown(patients);
    } catch (error) {
      console.error("Error fetching patient list:", error);
    }
  }

  // Populate patient dropdown
  function populatePatientDropdown(patients) {
    patients.forEach((patient) => {
      const option = document.createElement("option");
      option.value = `${patient.name}|${patient.dob}`;
      option.textContent = `${patient.name} (DOB: ${new Date(
        patient.dob
      ).toLocaleDateString()})`;
      patientSelect.appendChild(option);
    });
  }

  // Fetch patient data
  async function fetchPatientData(name, dob) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/patients/${encodeURIComponent(
          name
        )}/${encodeURIComponent(dob)}`
      );
      if (!response.ok) {
        throw new Error("Patient not found");
      }
      const patientData = await response.json();
      updatePatientInfo(patientData);
      fetchXrayImage(name, dob);
    } catch (error) {
      console.error("Error fetching patient data:", error);
    }
  }

  // Fetch X-ray image by patient name and dob
  async function fetchXrayImage(name, dob) {
    console.log("Fetching X-ray image for:", name, dob);

    try {
      // Construct the path based on patient data from the backend
      const response = await fetch(
        `http://localhost:3000/api/patients/${encodeURIComponent(name)}/${encodeURIComponent(dob)}/xray`
      );

      if (!response.ok) {
        throw new Error("X-ray image not found");
      }

      const data = await response.json();
      const imagePath = data.xray_image_path; // Assuming the backend returns the image path

      // Set the image source to the path of the X-ray image
      xrayImage.src = `http://localhost:3000/${imagePath}`;
    } catch (error) {
      console.error("Error fetching X-ray image:", error);
    }
  }

  // Update patient info displayed on the page
  function updatePatientInfo(patientData) {
    patientNameElement.textContent = patientData.name;
    patientDobElement.textContent = new Date(
      patientData.dob
    ).toLocaleDateString();
    patientGenderElement.textContent = patientData.gender;
    patientMedicalHistoryElement.textContent =
      patientData.medical_history || "No medical history available";
  }

  // Handle patient selection
  patientSelect.addEventListener("change", (event) => {
    const selectedValue = event.target.value;
    if (selectedValue) {
      const [name, dob] = selectedValue.split("|");
      fetchPatientData(name, dob);
    } else {
      // Clear patient info if no patient is selected
      patientNameElement.textContent = "";
      patientDobElement.textContent = "";
      patientGenderElement.textContent = "";
      patientMedicalHistoryElement.textContent = "";
      xrayImage.src = "";
    }
  });

  // Fetch patient list on page load
  fetchPatientList();

  // Zoom functionality
  zoomInBtn.addEventListener("click", () => {
    scale *= 1.2;
    xrayImage.style.transform = `scale(${scale})`;
  });

  zoomOutBtn.addEventListener("click", () => {
    scale /= 1.2;
    xrayImage.style.transform = `scale(${scale})`;
  });

  resetBtn.addEventListener("click", () => {
    scale = 1;
    xrayImage.style.transform = `scale(${scale})`;
    contrastSlider.value = 100;
    brightnessSlider.value = 100;
    updateImageFilters();
  });

  // Annotation functionality (toggle cursor style)
  annotateBtn.addEventListener("click", () => {
    isAnnotating = !isAnnotating;
    xrayContainer.style.cursor = isAnnotating ? "crosshair" : "default";
    annotateBtn.classList.toggle("btn-active");
  });

  // Image adjustment functionality
  function updateImageFilters() {
    const contrast = contrastSlider.value;
    const brightness = brightnessSlider.value;
    xrayImage.style.filter = `contrast(${contrast}%) brightness(${brightness}%)`;
    contrastValue.textContent = `${contrast}%`;
    brightnessValue.textContent = `${brightness}%`;
  }

  contrastSlider.addEventListener("input", updateImageFilters);
  brightnessSlider.addEventListener("input", updateImageFilters);

  // Simple annotation (just for demonstration)
  xrayContainer.addEventListener("click", (e) => {
    if (isAnnotating) {
      const rect = xrayContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const annotation = document.createElement("div");
      annotation.style.position = "absolute";
      annotation.style.left = `${x}px`;
      annotation.style.top = `${y}px`;
      annotation.style.width = "10px";
      annotation.style.height = "10px";
      annotation.style.backgroundColor = "red";
      xrayContainer.appendChild(annotation);
    }
  });
});
