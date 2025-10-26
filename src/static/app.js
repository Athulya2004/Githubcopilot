document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset activity select (avoid duplicate options on re-fetch)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Basic info
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";
            
            // Create span for participant email
            const emailSpan = document.createElement("span");
            // If participant is an object, prefer name/email; otherwise show string
            if (p && typeof p === "object") {
              emailSpan.textContent = p.name || p.email || JSON.stringify(p);
            } else {
              emailSpan.textContent = String(p);
            }
            li.appendChild(emailSpan);

            // Create delete button
            const deleteBtn = document.createElement("span");
            deleteBtn.innerHTML = "×";
            deleteBtn.className = "delete-icon";
            deleteBtn.title = "Unregister";
            
            // Add click handler for unregistering
            deleteBtn.addEventListener("click", async () => {
              const email = emailSpan.textContent;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                  {
                    method: "POST",
                  }
                );

                const result = await response.json();

                if (response.ok) {
                  // Remove participant from list
                  li.remove();
                  
                  // Show success message
                  messageDiv.textContent = result.message;
                  messageDiv.className = "success";
                  
                  // Update the spots left count
                  fetchActivities(); // Refresh the activity list
                } else {
                  messageDiv.textContent = result.detail || "An error occurred";
                  messageDiv.className = "error";
                }

                messageDiv.classList.remove("hidden");

                // Hide message after 5 seconds
                setTimeout(() => {
                  messageDiv.classList.add("hidden");
                }, 5000);
              } catch (error) {
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error unregistering:", error);
              }
            });

            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });

          participantsSection.appendChild(ul);
        } else {
          const empty = document.createElement("div");
          empty.className = "participants-empty";
          empty.textContent = "No participants yet.";
          participantsSection.appendChild(empty);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh the activities list to show the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
