
"use strict";

const APP_NAME = "CivicCare";
const STORAGE_KEY = "civicCare.complaints";
const LANGUAGE_KEY = "civicCare.language";

// 1. Read complaints from localStorage
function getComplaints() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Could not read complaints:", error);
    return [];
  }
}

// 2. Save complaints to localStorage
function saveComplaints(complaints) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(complaints)
  );
}

// 3. Initialize the website
document.addEventListener("DOMContentLoaded", () => {
  console.log(`${APP_NAME} is ready!`);

  // LANGUAGE SWITCHER
  const languageSelect = document.getElementById("languageSelect");

  function changeLanguage(language) {
    document.documentElement.lang = language;

    document.querySelectorAll("[data-en][data-ta]").forEach(element => {
      element.textContent = element.getAttribute(`data-${language}`);
    });

    localStorage.setItem(LANGUAGE_KEY, language);
  }

  if (languageSelect) {
    const savedLanguage =
      localStorage.getItem(LANGUAGE_KEY) || "en";

    languageSelect.value = savedLanguage;
    changeLanguage(savedLanguage);

    languageSelect.addEventListener("change", () => {
      changeLanguage(languageSelect.value);
    });
  }

  // CITIZEN COMPLAINT FORM
  const complaintForm = document.getElementById("complaintForm");
  const successMessage = document.getElementById("successMessage");

  if (complaintForm) {
    complaintForm.addEventListener("submit", event => {
      event.preventDefault();

      const form = event.currentTarget;
      const file = document.getElementById("evidence").files[0];

      if (file && !file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }

      if (file && file.size > 500 * 1024) {
        alert("Please choose an image smaller than 500 KB.");
        return;
      }

      const complaints = getComplaints();
      const year = new Date().getFullYear();

      const complaint = {
        id: `CIV-${year}-${Date.now()}`,
        title: form.elements["title"].value.trim(),
        category: form.elements["category"].value,
        location: form.elements["location"].value.trim(),
        description: form.elements["description"].value.trim(),
        status: "Submitted",
        assignedTo: null,
        createdAt: new Date().toISOString(),
        evidence: null
      };

      function saveNewComplaint() {
        try {
          complaints.push(complaint);
          saveComplaints(complaints);

          successMessage.hidden = false;
          successMessage.textContent =
            `Complaint submitted successfully! Your ID: ${complaint.id}`;

          form.reset();
        } catch (error) {
          console.error("Save failed:", error);
          alert("Could not save the complaint. Browser storage may be full.");
        }
      }

      if (file) {
        const reader = new FileReader();

        reader.onload = () => {
          complaint.evidence = reader.result;
          saveNewComplaint();
        };

        reader.onerror = () => {
          alert("Could not read the image.");
        };

        reader.readAsDataURL(file);
      } else {
        saveNewComplaint();
      }
    });
  }

  // TRACK A COMPLAINT
  const trackingForm = document.getElementById("trackingForm");
  const trackingResult = document.getElementById("trackingResult");

  if (trackingForm) {
    trackingForm.addEventListener("submit", event => {
      event.preventDefault();

      const id = document.getElementById("trackingId")
        .value.trim().toUpperCase();

      const complaint = getComplaints().find(
        item => item.id.toUpperCase() === id
      );

      trackingResult.replaceChildren();

      if (!complaint) {
        trackingResult.textContent =
          "Complaint not found. Please check the ID.";
        return;
      }

      const heading = document.createElement("h3");
      heading.textContent = complaint.title;

      const details = document.createElement("p");
      details.textContent =
        `ID: ${complaint.id} | Category: ${complaint.category} | Status: ${complaint.status}`;

      const location = document.createElement("p");
      location.textContent = `Location: ${complaint.location}`;

      const description = document.createElement("p");
      description.textContent = complaint.description;

      trackingResult.append(
        heading,
        details,
        location,
        description
      );
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const complaintsList = document.getElementById("complaintsList");

  // This code runs only on the Admin Portal.
  if (!complaintsList) return;

  function renderAdminComplaints() {
    const complaints = getComplaints();

    document.getElementById("totalCount").textContent = complaints.length;
    document.getElementById("pendingCount").textContent =
      complaints.filter(c => c.status !== "Resolved" && c.status !== "Verified").length;
    document.getElementById("resolvedCount").textContent =
      complaints.filter(c => c.status === "Resolved" || c.status === "Verified").length;

    complaintsList.replaceChildren();
    document.getElementById("emptyMessage").hidden = complaints.length > 0;

    complaints.forEach(complaint => {
      const card = document.createElement("article");
      card.className = "feature-card";
      card.style.marginTop = "18px";

      const title = document.createElement("h2");
      title.textContent = complaint.title;

      const details = document.createElement("p");
      details.textContent =
        `ID: ${complaint.id} | Category: ${complaint.category} | Status: ${complaint.status}`;

      const location = document.createElement("p");
      location.textContent = `Location: ${complaint.location}`;

      const description = document.createElement("p");
      description.textContent = complaint.description;

      const assignmentLabel = document.createElement("label");
      assignmentLabel.textContent = "Assign department: ";

      const departmentSelect = document.createElement("select");
      departmentSelect.innerHTML = `
        <option value="">Select department</option>
        <option value="Sanitation">Sanitation</option>
        <option value="Roads">Roads</option>
        <option value="Drainage">Drainage</option>
        <option value="Streetlights">Streetlights</option>
        <option value="Water Supply">Water Supply</option>
        <option value="General">General</option>
      `;
      departmentSelect.value = complaint.assignedTo || "";
      departmentSelect.style.display = "block";
      departmentSelect.style.margin = "10px 0";
      departmentSelect.style.padding = "10px";

      const assignButton = document.createElement("button");
      assignButton.className = "button primary";
      assignButton.textContent = "Save Assignment";

      assignButton.addEventListener("click", () => {
        const updated = getComplaints();
        const item = updated.find(c => c.id === complaint.id);

        if (!item) return;

        if (!departmentSelect.value) {
          alert("Please select a department.");
          return;
        }

        item.assignedTo = departmentSelect.value;
        if (item.status === "Submitted") item.status = "Assigned";

        saveComplaints(updated);
        renderAdminComplaints();
        alert("Department assigned successfully.");
      });

      card.append(
        title,
        details,
        location,
        description,
        assignmentLabel,
        departmentSelect,
        assignButton
      );

      if (complaint.evidence) {
        const evidenceTitle = document.createElement("p");
        evidenceTitle.textContent = "Citizen photo evidence:";

        const image = document.createElement("img");
        image.src = complaint.evidence;
        image.alt = "Citizen-provided complaint evidence";
        image.style.maxWidth = "220px";
        image.style.display = "block";
        image.style.marginTop = "10px";

        card.append(evidenceTitle, image);
      }

      complaintsList.appendChild(card);
    });
  }

  renderAdminComplaints();
});

document.addEventListener("DOMContentLoaded", () => {
  const complaintContainer = document.getElementById("departmentComplaints");
  if (!complaintContainer) return;

  function renderDepartmentComplaints() {
    const complaints = getComplaints().filter(c => c.assignedTo);

    complaintContainer.replaceChildren();
    document.getElementById("departmentEmpty").hidden = complaints.length > 0;

    complaints.forEach(complaint => {
      const card = document.createElement("article");
      card.className = "feature-card";
      card.style.marginTop = "18px";

      const title = document.createElement("h2");
      title.textContent = complaint.title;

      const info = document.createElement("p");
      info.textContent =
        `ID: ${complaint.id} | Department: ${complaint.assignedTo} | Status: ${complaint.status}`;

      const location = document.createElement("p");
      location.textContent = `Location: ${complaint.location}`;

      const notesLabel = document.createElement("label");
      notesLabel.textContent = "Work update / resolution notes";

      const notes = document.createElement("textarea");
      notes.rows = 3;
      notes.style.display = "block";
      notes.style.width = "100%";
      notes.style.margin = "10px 0";
      notes.value = complaint.resolutionNotes || "";

      const statusLabel = document.createElement("label");
      statusLabel.textContent = "Update status";

      const status = document.createElement("select");
      status.style.display = "block";
      status.style.margin = "10px 0";
      status.style.padding = "10px";

      ["Assigned", "In Progress", "Resolved"].forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        status.appendChild(option);
      });

      status.value = ["Assigned", "In Progress", "Resolved"].includes(complaint.status)
        ? complaint.status
        : "Assigned";

      const saveButton = document.createElement("button");
      saveButton.className = "button primary";
      saveButton.textContent = "Save Work Update";

      saveButton.addEventListener("click", () => {
        const allComplaints = getComplaints();
        const item = allComplaints.find(c => c.id === complaint.id);
        if (!item) return;

        item.status = status.value;
        item.resolutionNotes = notes.value.trim();
        item.updatedAt = new Date().toISOString();

        saveComplaints(allComplaints);
        renderDepartmentComplaints();
        alert("Work update saved successfully.");
      });

      card.append(title, info, location, notesLabel, notes, statusLabel, status, saveButton);

      
if (complaint.evidence) {
  const image = document.createElement("img");
  image.src = complaint.evidence;
  image.alt = "Citizen complaint photo — click to enlarge";

  image.style.width = "100%";
  image.style.maxWidth = "600px";
  image.style.maxHeight = "500px";
  image.style.objectFit = "contain";
  image.style.display = "block";
  image.style.marginTop = "12px";
  image.style.cursor = "zoom-in";
  image.style.borderRadius = "10px";

  image.addEventListener("click", () => {
    const viewer = document.createElement("div");

    viewer.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.92);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 9999;
      cursor: zoom-out;
    `;

    const enlargedImage = document.createElement("img");
    enlargedImage.src = image.src;
    enlargedImage.alt = image.alt;

    enlargedImage.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    `;

    viewer.appendChild(enlargedImage);
    viewer.addEventListener("click", () => viewer.remove());
    document.body.appendChild(viewer);
  });

  card.appendChild(image);
}


      complaintContainer.appendChild(card);
    });
  }

  renderDepartmentComplaints();
});


document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const demoUsers = {
    citizen: { username: "citizen", password: "citizen123", page: "citizen.html" },
    admin: { username: "admin", password: "admin123", page: "admin.html" },
    department: { username: "staff", password: "staff123", page: "department.html" }
  };

  loginForm.addEventListener("submit", event => {
    event.preventDefault();

    const role = document.getElementById("loginRole").value;
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;
    const message = document.getElementById("loginMessage");
    const user = demoUsers[role];

    if (username === user.username && password === user.password) {
      // Demo session only. Not secure authentication.
      localStorage.setItem("civicCare.demoRole", role);
      window.location.href = user.page;
    } else {
      message.textContent = "Incorrect username or password. Please try again.";
    }
  });
});
