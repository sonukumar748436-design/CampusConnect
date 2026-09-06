/* =========================================
   CAMPUSCONNECT APP.JS
========================================= */

// Elements
const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginMessage = document.getElementById("loginMessage");
const registerMessage =
  document.getElementById("registerMessage");


/* =========================================
   LOGIN / REGISTER MODALS
========================================= */

function openLogin() {
  closeRegister();

  loginModal.classList.add("show");

  loginMessage.textContent = "";
}

function closeLogin() {
  loginModal.classList.remove("show");
}

function openRegister() {
  closeLogin();

  registerModal.classList.add("show");

  registerMessage.textContent = "";
}

function closeRegister() {
  registerModal.classList.remove("show");
}

function switchToRegister() {
  closeLogin();
  openRegister();
}

function switchToLogin() {
  closeRegister();
  openLogin();
}


/* =========================================
   FEATURES SCROLL
========================================= */

function scrollToFeatures() {
  document
    .getElementById("features")
    .scrollIntoView({
      behavior: "smooth"
    });
}


/* =========================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================= */

window.addEventListener("click", (event) => {

  if (event.target === loginModal) {
    closeLogin();
  }

  if (event.target === registerModal) {
    closeRegister();
  }

});


/* =========================================
   REGISTER
========================================= */

registerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    registerMessage.textContent =
      "Creating your profile...";

    const skills =
      getArrayFromInput(
        "registerSkills"
      );

    const interests =
      getArrayFromInput(
        "registerInterests"
      );

    const hobbies =
      getArrayFromInput(
        "registerHobbies"
      );

    const userData = {

      name:
        document.getElementById(
          "registerName"
        ).value.trim(),

      email:
        document.getElementById(
          "registerEmail"
        ).value.trim(),

      password:
        document.getElementById(
          "registerPassword"
        ).value,

      course:
        document.getElementById(
          "registerCourse"
        ).value.trim(),

      year:
        document.getElementById(
          "registerYear"
        ).value,

      skills,

      interests,

      hobbies,

      careerGoal:
        document.getElementById(
          "registerCareer"
        ).value.trim()
    };


    try {

      const response =
        await fetch(
          "/api/register",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify(userData)
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        registerMessage.textContent =
          data.message ||
          "Registration failed.";

        return;
      }


      // Save logged-in user
      localStorage.setItem(
        "campusUser",
        JSON.stringify(data.user)
      );


      registerMessage.textContent =
        "Registration successful!";


      setTimeout(() => {

        window.location.href =
          "dashboard.html";

      }, 700);


    } catch (error) {

      console.error(error);

      registerMessage.textContent =
        "Server connection failed. Make sure the server is running.";

    }

  }
);


/* =========================================
   LOGIN
========================================= */

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginMessage.textContent =
      "Logging in...";


    const email =
      document.getElementById(
        "loginEmail"
      ).value.trim();

    const password =
      document.getElementById(
        "loginPassword"
      ).value;


    try {

      const response =
        await fetch(
          "/api/login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        loginMessage.textContent =
          data.message ||
          "Login failed.";

        return;
      }


      // Save user
      localStorage.setItem(
        "campusUser",
        JSON.stringify(data.user)
      );


      loginMessage.textContent =
        "Login successful!";


      setTimeout(() => {

        window.location.href =
          "dashboard.html";

      }, 500);


    } catch (error) {

      console.error(error);

      loginMessage.textContent =
        "Server connection failed. Make sure the server is running.";

    }

  }
);


/* =========================================
   CONVERT COMMA SEPARATED TEXT TO ARRAY
========================================= */

function getArrayFromInput(id) {

  const value =
    document.getElementById(id).value;

  if (!value.trim()) {
    return [];
  }

  return value
    .split(",")
    .map(item =>
      item.trim()
    )
    .filter(item =>
      item.length > 0
    );

}


/* =========================================
   CHECK LOGIN STATUS
========================================= */

function getCurrentUser() {

  const user =
    localStorage.getItem(
      "campusUser"
    );

  if (!user) {
    return null;
  }

  try {

    return JSON.parse(user);

  } catch (error) {

    localStorage.removeItem(
      "campusUser"
    );

    return null;

  }

}


/* =========================================
   LOGOUT
========================================= */

function logout() {

  localStorage.removeItem(
    "campusUser"
  );

  window.location.href =
    "index.html";

}


/* =========================================
   PROTECT DASHBOARD
========================================= */

function requireLogin() {

  const user =
    getCurrentUser();

  if (!user) {

    window.location.href =
      "index.html";

    return null;
  }

  return user;

}
// PROFILE PICTURE PREVIEW
const profilePicInput = document.getElementById("profilePicInput");
const profilePicPreview = document.getElementById("profilePicPreview");

if (profilePicInput && profilePicPreview) {
    profilePicInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            this.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image must be less than 5 MB.");
            this.value = "";
            return;
        }

        profilePicPreview.src = URL.createObjectURL(file);
    });
}