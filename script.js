const today = new Date();
const formattedDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

const supabasePublicClient = supabase.createClient("https://ptiekggppucoprpfbjkj.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWVrZ2dwcHVjb3BycGZiamtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTczNzIsImV4cCI6MjA1ODgzMzM3Mn0.FWSTbh0sK3J_PTy0vg43F7ET-tuKqluHR2WArg0rgPQ", {
    db: {
        schema: "public"
    }
});

(async () => {
    const response = await supabasePublicClient.from("sets").select("*")

    
})();





// DOM Elements
const workoutForm = document.getElementById('workoutForm');
const exercisesContainer = document.getElementById('exercisesContainer');
const addExerciseBtn = document.getElementById('addExerciseBtn');
const tagsContainer = document.getElementById('tagsContainer');
const tagInput = document.getElementById('tagInput');
const addTagBtn = document.getElementById('addTagBtn');
const searchInput = document.getElementById('searchInput');
const filterType = document.getElementById('filterType');
const workoutsContainer = document.getElementById('workoutsContainer');
const tagSearchInput = document.getElementById('tagSearchInput');


/*
const exercisePreviewContainer = document.createElement('div');
exercisePreviewContainer.className = 'exercise-preview-container';
exercisePreviewContainer.innerHTML = '<h3>Added Exercises</h3>';
*/

// State
let exercisePreviewContainer;
let workouts = [];
let currentTags = [];
let exerciseCounter = 1;

// Initialize the app
async function init() {
    try {
      // Load workouts from Supabase
      await loadWorkouts();
      renderWorkouts();
      setupEventListeners();
      
      // Create and insert exercise preview container
      exercisePreviewContainer = document.createElement('div');
      exercisePreviewContainer.className = 'exercise-preview-container';
      exercisePreviewContainer.innerHTML = '<h3>Added Exercises</h3>';
      
      // Check if elements exist before inserting
      if (!exercisesContainer) {
        console.error('Exercises container not found!');
        return;
      }
      
      if (!exercisesContainer.parentNode) {
        console.error('Exercises container parent not found!');
        return;
      }
      
      if (!addExerciseBtn) {
        console.error('Add exercise button not found!');
        // Fall back to appending to exercises container
        exercisesContainer.appendChild(exercisePreviewContainer);
      } else {
        // Insert after exercises container but before add button
        console.log('Inserting preview container');
        exercisesContainer.parentNode.insertBefore(exercisePreviewContainer, addExerciseBtn.nextSibling);
      }
      
      // Set up initial exercise row buttons
      const initialRow = exercisesContainer.querySelector('.exercise-row');
      if (initialRow) {
        setupExerciseRowButtons(initialRow);
      }
    } catch (err) {
      console.error('Error initializing application:', err);
    }
  }
  async function loadSetsFromSupabase() {
    try {
      const { data, error } = await supabasePublicClient.from("sets").select("*");
      
      if (error) {
        console.error('Error loading sets from Supabase:', error);
        return [];
      }
      
      console.log('Successfully loaded sets from Supabase:', data);
      
      // Log tag information for debugging
      if (data && data.length > 0) {
        data.forEach((set, index) => {
          console.log(`Set ${index} tags:`, set.tags, typeof set.tags);
        });
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception when loading sets from Supabase:', err);
      return [];
    }
}

// Convert Supabase set format to our local workout format
function convertSupabaseSetToWorkout(set) {
  // Extract and process tags to ensure they're readable strings
  let processedTags = [];
  
  if (set.tags) {
      // If tags is an array
      if (Array.isArray(set.tags)) {
          processedTags = set.tags.map(tag => {
              // Convert each tag to string and capitalize first letter
              return formatTagString(String(tag));
          });
      } 
      // If tags is a string (might be JSON)
      else if (typeof set.tags === 'string') {
          try {
              // Try to parse as JSON
              const parsedTags = JSON.parse(set.tags);
              if (Array.isArray(parsedTags)) {
                  processedTags = parsedTags.map(tag => formatTagString(String(tag)));
              } else {
                  // If it's a JSON object, extract values
                  processedTags = Object.values(parsedTags).map(tag => formatTagString(String(tag)));
              }
          } catch (e) {
              // If not valid JSON, treat as a single tag
              processedTags = [formatTagString(set.tags)];
          }
      }
      // If tags is an object (not an array)
      else if (typeof set.tags === 'object') {
          processedTags = Object.values(set.tags).map(tag => formatTagString(String(tag)));
      }
  }
  
  // Filter out any empty tags
  processedTags = processedTags.filter(tag => tag && tag.trim() !== '');
  
  return {
      id: set.id,
      title: set.name || 'Unnamed Workout',
      totalDistance: set.total_distance || 0,
      mainStroke: set.main_stroke || 'freestyle',
      intensity: set.intensity || 'medium',
      distanceType: set.distance_type || 'yards',
      notes: set.notes || '',
      exercises: Array.isArray(set.exercise) ? set.exercise.map(ex => ({
          repeats: ex.repeats || 1,
          amount: ex.amount || 0,
          stroke: ex.stroke || 'freestyle',
          drill: ex.drill || '',
          interval: ex.interval || ''
      })) : [],
      tags: processedTags,
      date: set.date || new Date().toISOString()
  };
}
// Load workouts from localStorage
async function loadWorkouts() {
    try {
      const sets = await loadSetsFromSupabase();
      workouts = sets.map(convertSupabaseSetToWorkout);
      return workouts;
    } catch (err) {
      console.error('Error loading workouts:', err);
      return [];
    }
  }
// Save workouts to localStorage
function saveWorkouts() {
    localStorage.setItem('swimWorkouts', JSON.stringify(workouts));
}
function addWorkoutCardEventListeners(workoutCard, workout) {
    
    // Add a visual indicator that the card is clickable
    workoutCard.style.cursor = 'pointer';
    
    // Add hover effect
    workoutCard.addEventListener('mouseenter', () => {
      workoutCard.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    });
    
    workoutCard.addEventListener('mouseleave', () => {
      workoutCard.style.boxShadow = '';
    });
  }
// Setup event listeners
function setupEventListeners() {
  // Form submission
  workoutForm.addEventListener('submit', handleFormSubmit);
  
  // Add exercise button
  addExerciseBtn.addEventListener('click', addExercise);
  
  // Add tag button
  addTagBtn.addEventListener('click', addTag);
  tagInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          addTag();
      }
  });
  
  // Search and filter
  searchInput.addEventListener('input', renderWorkouts);
  
  // Add tag search listener
  tagSearchInput.addEventListener('input', renderWorkouts);
  
  // If filterType exists, add its event listener
  if (filterType) {
      filterType.addEventListener('change', renderWorkouts);
  }
}
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect exercises from preview
    const exercises = [];
    const previewItems = exercisePreviewContainer.querySelectorAll('.exercise-preview-item');
    
    previewItems.forEach(item => {
      const repeats = item.querySelector('.preview-repeats').value;
      const amount = item.querySelector('.preview-amount').value;
      const stroke = item.querySelector('.preview-stroke').value;
      const drill = item.querySelector('.preview-drill').value;
      const interval = item.querySelector('.preview-interval').value;
      
      exercises.push({
        repeats,
        amount,
        stroke,
        drill,
        interval
      });
    });
    
    // Check if there are any exercises
    if (exercises.length === 0) {
      alert('No exercises have been added to this workout. Please add at least one exercise before saving.');
      return;
    }
    
    // Get other form values
    const title = document.getElementById('title').value;
    let totalDistance = document.getElementById('totalDistance').value;
    const mainStroke = document.getElementById('mainStroke').value;
    const intensity = document.getElementById('intensity').value;
    const distanceType = document.getElementById('distanceType').value;
    const notes = document.getElementById('notes').value;
    
    // Auto-calculate total distance if not provided
    if (!totalDistance) {
      totalDistance = exercises.reduce((sum, ex) => {
        return sum + (parseInt(ex.repeats) || 1) * (parseInt(ex.amount) || 0);
      }, 0);
    }
    
    // Create workout summary for confirmation
    let confirmMessage = `Workout Summary:\n\n`;
    confirmMessage += `Title: ${title}\n`;
    confirmMessage += `Total Distance: ${totalDistance}m\n`;
    confirmMessage += `Main Stroke: ${mainStroke}\n`;
    confirmMessage += `Intensity: ${intensity}\n`;
    confirmMessage += `Distance Type: ${distanceType}\n\n`;
    
    confirmMessage += `Exercises (${exercises.length}):\n`;
    exercises.forEach((ex, index) => {
      const repeats = parseInt(ex.repeats) > 1 ? `${ex.repeats}x ` : '';
      confirmMessage += `${index + 1}. ${repeats}${ex.amount}m ${ex.stroke}${ex.drill ? ` (${ex.drill})` : ''}${ex.interval ? ` @ ${ex.interval}` : ''}\n`;
    });
    
    confirmMessage += `\nDo you want to save this workout?`;
  
    exercisesJson = JSON.stringify(exercises, null, 2);
  
    // Show confirmation dialog
    if (confirm(confirmMessage)) {
      // Create workout object
      const workout = {
        id: Date.now(),
        title,
        totalDistance,
        mainStroke,
        intensity,
        distanceType,
        notes,
        exercises,
        tags: [...currentTags],
        date: new Date().toISOString()
      };
      rows = [title, totalDistance, mainStroke, intensity, distanceType, exercisesJson, currentTags, notes];
  
      uploadWorkoutToSupabase(workout)
      .then((result) => {
        console.log('Upload result:', result);
        
        // After upload, reload workouts from Supabase
        loadWorkouts().then(() => {
          renderWorkouts();
          
          workoutForm.reset();
          resetExercises();
          resetTags();
          resetExercisePreview();
          
          alert('Workout uploaded successfully!');
        });
      })
      .catch(error => {
        console.error('Error uploading workout:', error);
        alert('Error saving workout: ' + error.message);
      });
    }
  }
async function uploadWorkoutToSupabase(workout) {
    // Prepare exercise array
    const exerciseArray = workout.exercises.map(exercise => ({
        repeats: exercise.repeats,
        amount: exercise.amount,
        stroke: exercise.stroke,
        drill: exercise.drill,
        interval: exercise.interval
    }));
    console.log('Exercise Array:', exerciseArray);

    try {
        const response = await fetch('https://ptiekggppucoprpfbjkj.supabase.co/rest/v1/rpc/add_set', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWVrZ2dwcHVjb3BycGZiamtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTczNzIsImV4cCI6MjA1ODgzMzM3Mn0.FWSTbh0sK3J_PTy0vg43F7ET-tuKqluHR2WArg0rgPQ',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0aWVrZ2dwcHVjb3BycGZiamtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyNTczNzIsImV4cCI6MjA1ODgzMzM3Mn0.FWSTbh0sK3J_PTy0vg43F7ET-tuKqluHR2WArg0rgPQ'
            },
            body: JSON.stringify({
                date: formattedDate,
                name: workout.title,
                notes: workout.notes,
                tags: workout.tags,
                total_distance: workout.totalDistance,
                distance_type: workout.distanceType,
                intensity: workout.intensity,
                exercise: exerciseArray,
                main_stroke: workout.mainStroke
            })
        });
        
        // Log the raw response for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        // Check if response is OK first
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        // Get the response text first to see what we're dealing with
        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // If empty response or non-JSON, handle it appropriately
        if (!responseText || responseText.trim() === '') {
            console.log('Empty response received, but status was OK');
            return true; // Return success since status was OK
        }
        
        // Try to parse as JSON only if there's content
        try {
            const data = JSON.parse(responseText);
            console.log('Parsed JSON response:', data);
            return data;
        } catch (jsonError) {
            console.warn('Received non-JSON response:', responseText);
            // If response was not JSON but status was OK, still consider it a success
            return true;
        }
    } catch (error) {
        console.error('Error in uploadWorkoutToSupabase:', error);
        throw error;
    }
}
// Add a new exercise row
function addExercise() {
    const newExerciseRow = document.createElement('div');
    newExerciseRow.className = 'exercise-row';
    newExerciseRow.dataset.index = exerciseCounter++;
    
    newExerciseRow.innerHTML = `
        <div class="exercise-grid">
            <div class="form-group">
                <label>Repeats</label>
                <input type="number" class="exercise-repeats" value="1" min="1">
            </div>
            
            <div class="form-group">
                <label>Distance (m)</label>
                <input type="number" class="exercise-amount" required>
            </div>
            
            <div class="form-group">
                <label>Stroke</label>
                <select class="exercise-stroke">
                    <option value="freestyle">Freestyle</option>
                    <option value="backstroke">Backstroke</option>
                    <option value="breaststroke">Breaststroke</option>
                    <option value="butterfly">Butterfly</option>
                    <option value="im">IM</option>
                    <option value="kick">Kick</option>
                    <option value="drill">Drill</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Drill/Description</label>
                <input type="text" class="exercise-drill" placeholder="Optional">
            </div>
            
            <div class="form-group">
                <label>Interval</label>
                <input type="text" class="exercise-interval" placeholder="e.g. 1:30">
            </div>
        </div>
        <div class="exercise-actions">
            <button type="button" class="button button-secondary add-to-preview">Add to Workout</button>
            <button type="button" class="remove-exercise">Cancel</button>
        </div>
    `;
    
    exercisesContainer.appendChild(newExerciseRow);
    setupExerciseRowButtons(newExerciseRow);


}

// Set up buttons for an exercise row
function setupExerciseRowButtons(row) {
    // Add remove exercise button functionality
    const removeBtn = row.querySelector('.remove-exercise');
    if (!removeBtn) {
        console.error("Remove button not found in row:", row)
    }
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {

            // If this is the only row, just clear it
            if (exercisesContainer.querySelectorAll('.exercise-row').length === 1) {
                row.querySelector('.exercise-repeats').value = 1;
                row.querySelector('.exercise-amount').value = '';
                row.querySelector('.exercise-drill').value = '';
                row.querySelector('.exercise-interval').value = '';
                
                // Reset the add button if it was modified
                const addBtn = row.querySelector('.add-to-preview');
                addBtn.textContent = 'Add to Workout';
                addBtn.disabled = false;
            } else {
                // Otherwise, remove the row
                exercisesContainer.removeChild(row);
            }
        });
    }
    // In setupExerciseRowButtons function
    const addToPreviewBtn = row.querySelector('.add-to-preview');
    if (addToPreviewBtn) {
        addToPreviewBtn.addEventListener('click', function() {
            const repeats = row.querySelector('.exercise-repeats').value || 1;
            const amount = row.querySelector('.exercise-amount').value;
            const stroke = row.querySelector('.exercise-stroke').value;
            const drill = row.querySelector('.exercise-drill').value;
            const interval = row.querySelector('.exercise-interval').value;
            
            // Only check for amount, make everything else optional
            if (!amount || amount <= 0) {
                alert('Please enter a valid distance for the exercise');
                return;
            }
            
            addExerciseToPreview(repeats, amount, stroke, drill, interval);
            
            // Add visual feedback
            this.textContent = 'Added!';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = 'Add to Workout';
                this.disabled = false;
            }, 1500);
        });
    }
}

// Function to display exercise in the preview
function addExerciseToPreview(repeats, amount, stroke, drill, interval) {

    if(!exercisePreviewContainer) {
        console.error("Exercise preview container not found!");
        return;
    }
    const exercisePreview = document.createElement('div');
    exercisePreview.className = 'exercise-preview-item';
    
    const repeatText = parseInt(repeats) > 1 ? `${repeats}x ` : '';
    const drillText = drill ? ` (${drill})` : '';
    const intervalText = interval ? ` @ ${interval}` : '';
    
    exercisePreview.innerHTML = `
        <span class="preview-text">${repeatText}${amount}m ${stroke}${drillText}${intervalText}</span>
        <button type="button" class="button button-small remove-preview">×</button>
        <input type="hidden" class="preview-repeats" value="${repeats}">
        <input type="hidden" class="preview-amount" value="${amount}">
        <input type="hidden" class="preview-stroke" value="${stroke}">
        <input type="hidden" class="preview-drill" value="${drill}">
        <input type="hidden" class="preview-interval" value="${interval}">
    `;
    
    // Add remove functionality
    const removeBtn = exercisePreview.querySelector('.remove-preview');
    removeBtn.addEventListener('click', () => {
        exercisePreviewContainer.removeChild(exercisePreview);
        updateTotalDistance();
    });
    
    exercisePreviewContainer.appendChild(exercisePreview);
    updateTotalDistance();
}

// Update total distance based on preview exercises
function updateTotalDistance() {
    const totalDistanceInput = document.getElementById('totalDistance');
    if (totalDistanceInput.value !== '') return; // Don't auto-calculate if manually set
    
    const previewItems = exercisePreviewContainer.querySelectorAll('.exercise-preview-item');
    let totalDistance = 0;
    
    previewItems.forEach(item => {
        const repeats = parseInt(item.querySelector('.preview-repeats').value) || 1;
        const amount = parseInt(item.querySelector('.preview-amount').value) || 0;
        totalDistance += repeats * amount;
    });
    
    totalDistanceInput.placeholder = `Auto-calculated: ${totalDistance}m`;
}

// Reset exercise preview
function resetExercisePreview() {
    exercisePreviewContainer.innerHTML = '<h3>Added Exercises</h3>';
}

// Reset exercises to initial state
function resetExercises() {
    exercisesContainer.innerHTML = `
        <div class="exercise-row" data-index="0">
            <div class="exercise-grid">
                <div class="form-group">
                    <label>Repeats</label>
                    <input type="number" class="exercise-repeats" value="1" min="1">
                </div>
                
                <div class="form-group">
                    <label>Amount (m)</label>
                    <input type="number" class="exercise-amount" required>
                </div>
                
                <div class="form-group">
                    <label>Stroke</label>
                    <select class="exercise-stroke">
                        <option value="freestyle">Freestyle</option>
                        <option value="backstroke">Backstroke</option>
                        <option value="breaststroke">Breaststroke</option>
                        <option value="butterfly">Butterfly</option>
                        <option value="im">IM</option>
                        <option value="kick">Kick</option>
                        <option value="drill">Drill</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Drill/Description</label>
                    <input type="text" class="exercise-drill" placeholder="Optional">
                </div>
                
                <div class="form-group">
                    <label>Interval</label>
                    <input type="text" class="exercise-interval" placeholder="e.g. 1:30">
                </div>
            </div>
            <div class="exercise-actions">
                <button type="button" class="button button-secondary add-to-preview">Add to Workout</button>
                <button type="button" class="remove-exercise">Cancel</button>
            </div>
        </div>
    `;
    
    // Setup buttons for the initial row
    setupExerciseRowButtons(exercisesContainer.querySelector('.exercise-row'));
    
    exerciseCounter = 1;
}
function formatTagString(tag) {
  if (!tag) return '';
  
  // Remove any quotes, brackets, or other JSON artifacts
  tag = tag.replace(/["'\{\}\[\]]/g, '');
  
  // Replace underscores with spaces
  tag = tag.replace(/_/g, ' ');
  
  // Capitalize first letter of each word
  return tag.trim().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
}
// Add a tag
function addTag() {
  const tag = formatTagString(tagInput.value.trim());
  if (tag && !currentTags.includes(tag)) {
      currentTags.push(tag);
      renderTags();
      tagInput.value = '';
  }
}

// Remove a tag
function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTags();
}

// Render tags
function renderTags() {
    tagsContainer.innerHTML = '';
    
    currentTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag}
            <span class="tag-remove">×</span>
        `;
        
        const removeBtn = tagElement.querySelector('.tag-remove');
        removeBtn.addEventListener('click', () => removeTag(tag));
        
        tagsContainer.appendChild(tagElement);
    });
}

// Reset tags
function resetTags() {
    currentTags = [];
    renderTags();
}

// Filter workouts based on search and filter type
function filterWorkouts() {
  const searchTerm = searchInput.value.toLowerCase();
  const tagSearchTerm = tagSearchInput ? tagSearchInput.value.toLowerCase() : '';
  
  return workouts.filter(workout => {
      // Match by title or notes
      const matchesSearch = 
          (workout.title && workout.title.toLowerCase().includes(searchTerm)) || 
          (workout.notes && workout.notes.toLowerCase().includes(searchTerm));
      
      // Match by formatted tags
      const matchesTags = tagSearchTerm === '' || 
          (Array.isArray(workout.tags) && 
          workout.tags.some(tag => tag && tag.toLowerCase().includes(tagSearchTerm)));
      
      return matchesSearch && matchesTags;
  });
}

// Render workouts
function renderWorkouts() {
    const filteredWorkouts = filterWorkouts();
    
    if (filteredWorkouts.length === 0) {
      workoutsContainer.innerHTML = `
        <div class="card empty-state">
          <p>No workouts found. Try a different searchs</p>
        </div>
      `;
      return;
    }
    
    workoutsContainer.innerHTML = '';
    
    filteredWorkouts.forEach(workout => {
      const workoutCard = document.createElement('div');
      workoutCard.className = 'card workout-card';
      
      // Meta items
      const metaItems = `
        <div class="meta-item">
          <span class="meta-label">Distance:</span> ${workout.totalDistance}m
        </div>
        <div class="meta-item">
          <span class="meta-label">Main:</span> ${workout.mainStroke}
        </div>
        <div class="meta-item">
          <span class="meta-label">Intensity:</span> ${workout.intensity}
        </div>
        <div class="meta-item">
          <span class="meta-label">Type:</span> ${workout.distanceType}
        </div>
      `;
      
      // Exercises table
      let exercisesHTML = `
        <div class="section-heading">Exercises:</div>
        <div class="exercises-container">
          <table class="exercises-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Stroke/Drill</th>
                <th>Interval</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      if (Array.isArray(workout.exercises)) {
        workout.exercises.forEach(ex => {
          const repeats = parseInt(ex.repeats) || 1;
          const repeatText = repeats > 1 ? `${repeats}x ` : '';
          
          exercisesHTML += `
            <tr>
              <td>${repeatText}${ex.amount}m</td>
              <td>${ex.stroke} ${ex.drill ? `(${ex.drill})` : ''}</td>
              <td>${ex.interval ? `@ ${ex.interval}` : 'N/A'}</td>
            </tr>
          `;
        });
      }
      
      exercisesHTML += `
            </tbody>
          </table>
        </div>
      `;
      
      // Tags
      let tagsHTML = '';
      if (workout.tags && Array.isArray(workout.tags) && workout.tags.length > 0) {
          tagsHTML = `
              <div class="workout-tags">
                  <div class="section-heading">Tags:</div>
                  <div class="tags-container">
                      ${workout.tags.map(tag => 
                          tag ? `<span class="tag">${tag}</span>` : ''
                      ).join('')}
                  </div>
              </div>
          `;
      }
      
      // Notes
      let notesHTML = '';
      if (workout.notes) {
        notesHTML = `
          <div class="workout-notes">
            <div class="section-heading">Notes:</div>
            <p>${workout.notes}</p>
          </div>
        `;
      }
      
      workoutCard.innerHTML = `
        <div class="workout-header">
          <h3 class="workout-title">${workout.title}</h3>

        </div>
        
        <div class="workout-meta">
          ${metaItems}
        </div>
        
        <div class="workout-exercises">
          ${exercisesHTML}
        </div>
        
        ${tagsHTML}
        ${notesHTML}
        
        <div class="workout-date">
          Added: ${new Date(workout.date).toLocaleDateString()}
        </div>
      `;
      
      // Add event listeners for loading this workout
      addWorkoutCardEventListeners(workoutCard, workout);
      
      workoutsContainer.appendChild(workoutCard);
    });
  }


// Initialize the application
document.addEventListener('DOMContentLoaded', init);