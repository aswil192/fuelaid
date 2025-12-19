const path = window.location.pathname;
const items = document.querySelectorAll("#sidebar-nav a");
const activeItem = [].slice.call(items).find(item => item.getAttribute("href") == path);
if(activeItem) {
	activeItem.classList.add("active");
}

window.setTimeout(() => {
	let alertsWrapper = document.querySelector(".alerts-wrapper");
	if(alertsWrapper) {
		alertsWrapper.style.display = "none";
	}
}, 5000);


let btn = document.querySelector("#sidebar-toggler-btn");
if(btn) {
	btn.addEventListener("click", () => {
		document.querySelector("#sidebar").classList.toggle("sidebar-hide");
	});
}

document.getElementById("toggle-login").addEventListener("click", function () {
	document.getElementById("signup-form").style.display = "none";
	document.getElementById("login-form").style.display = "block";
	document.getElementById("form-title").innerText = "Login";
  });

  document.getElementById("toggle-signup").addEventListener("click", function () {
	document.getElementById("signup-form").style.display = "block";
	document.getElementById("login-form").style.display = "none";
	document.getElementById("form-title").innerText = "Sign Up";
  });


  document.addEventListener("DOMContentLoaded", function () {
	let params = new URLSearchParams(window.location.search);
	let role = params.get("role");
	
	if (role) {
	  document.getElementById("form-title").innerText = `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`;
	}

	const signupForm = document.getElementById("signup-form");
	const loginForm = document.getElementById("login-form");
	const formTitle = document.getElementById("form-title");
	const toggleLogin = document.getElementById("toggle-login");
	const toggleSignup = document.getElementById("toggle-signup");
	const toggleTexts = document.querySelectorAll(".toggle");

	toggleLogin.addEventListener("click", function (event) {
	  event.preventDefault();
	  signupForm.style.display = "none";
	  loginForm.style.display = "block";
	  formTitle.innerText = "Login";
	  toggleTexts[0].style.display = "none";
	  toggleTexts[1].style.display = "block";
	});

	toggleSignup.addEventListener("click", function (event) {
	  event.preventDefault();
	  signupForm.style.display = "block";
	  loginForm.style.display = "none";
	  formTitle.innerText = "Sign Up";
	  toggleTexts[0].style.display = "block";
	  toggleTexts[1].style.display = "none";
	});
  });

  document.getElementById('signup-form').addEventListener('submit', async function (e) {
e.preventDefault();

const user = {
  name: document.getElementById('name').value,
  email: document.getElementById('email').value,
  phone: document.getElementById('phone').value,
  password: document.getElementById('password').value,
  role: new URLSearchParams(window.location.search).get('role') || 'user',
  vehicleType: document.getElementById('vehicle-type').value,
  vehicleModel: document.getElementById('vehicle-model').value,
  licensePlate: document.getElementById('license-plate').value,
  fuelType: document.getElementById('fuel-type').value,
  address: document.getElementById('address').value,
  emergencyContact: document.getElementById('emergency-contact').value
};

try {
  const response = await fetch('http://localhost:5000/api/auth/signup', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(user)
  });

  const data = await response.json();
  if (response.ok) {
	alert('Signup successful!');
	window.location.href = 'login.html';
  } else {
	alert(`Error: ${data.message}`);
  }
} catch (error) {
  console.error('Signup failed:', error);
}
});


  document.getElementById('get-location').addEventListener('click', function () {
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(function (position) {
	const lat = position.coords.latitude;
	const lng = position.coords.longitude;
	document.getElementById('address').value = `Lat: ${lat}, Lng: ${lng}`;
  }, function (error) {
	alert('Error getting location. Make sure location services are enabled.');
  });
} else {
  alert('Geolocation is not supported by this browser.');
}
});

// Handle Profile Picture Preview
document.getElementById('profile-picture').addEventListener('change', function (event) {
const file = event.target.files[0];
if (file) {
  const reader = new FileReader();
  reader.onload = function (e) {
	const img = document.getElementById('profile-preview');
	img.src = e.target.result;
	img.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
});
