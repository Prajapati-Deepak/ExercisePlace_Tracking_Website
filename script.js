'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout{
    date=new Date();
    id=(Date.now()   +'').slice(-10);
    constructor(distance,duration,coords){
      this.distance=distance;     //km
      this.duration=duration;    //min
      this.coords=coords;       //[lat,lng]
      
    }

    _setdiscription(){
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.discription=`${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}
class Running extends Workout{
    type='running';
    constructor(distance, duration, coords, cadence){
        super(distance,duration,coords);
        this.cadence=cadence;
        this._pace();
        this._setdiscription();
    }
    _pace(){
        this.pace=this.duration/this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    type='cycling';
    constructor(distance, duration, coords,elevationGain){
        super(distance, duration, coords);
        this.elevationGain=elevationGain;
        this._speed();
        this._setdiscription();
    }
    _speed(){
        this.speed=this.distance/(this.duration/60);
        return this.speed;
    }
}



// APPLICATION ARCHITECTURE---------------------------------------
class App{
    #map;
    #mapZoomLevel=15;
    #mapEvent;
    #workouts=[];
    //constructor=====================================================================
    constructor(){
      this._getPosition();
      //get local storage from url
      this._getLocalStorage();
     
      form.addEventListener('submit',this._newWorkout.bind(this));
      inputType.addEventListener('change',this._toggleElevationField);
      containerWorkouts.addEventListener('click',this._movetoPopup.bind(this));
      containerWorkouts.addEventListener('dblclick',this._editValue.bind(this));
    }
    // constructor===================================================================

    // GETpOSITION======================
    _getPosition(){
    if(navigator.geolocation)
    navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(error){
    alert('we could not find your location ');
    console.log(error);
    });
    }
    //LOAD MAP========================
    _loadMap(position){

       // console.log(position);
        const{latitude}=position.coords;
        const {longitude}=position.coords;
        //console.log(latitude,longitude);
        const coords=[latitude,longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.#map);   
    //Handling clicks on map 
     this.#map.on('click',this._showForm.bind(this)); 

     //rendorworkoutMarker
     this.#workouts.forEach(work=>{
         this._rendorWorkoutMarker(work);
        });

    }
 //SHOWFORM==================================
    _showForm(mapE){
        this.#mapEvent=mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }
// HIDE FORM===================================
  _hideform(){
    inputDistance.value=inputDuration.value=inputElevation.value=inputCadence.value='';
    
    form.style.display='none';
    form.classList.add('hidden');
    setTimeout(()=>form.style.display='grid',1000);

  }
//TOGGLELEVATION FIELD ===================================
    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _newWorkout(e){

        const validinput=(...inputs)=>inputs.every(inp=>Number.isFinite(inp));
        const allPositive=((...inputs)=>inputs.every(inp=>inp>0));

        e.preventDefault();
       
        const type=inputType.value;
        const distance= +inputDistance.value;
        const duration= +inputDuration.value;
        const {lat,lng}=this.#mapEvent.latlng;
        let workout;
        if(type==='running'){
            const cadence=+inputCadence.value;
            if(!validinput(distance,duration,cadence)||!allPositive(distance,duration,cadence))
            return alert('Inputs have to be positive!');

            workout=new Running(distance,duration,[lat,lng],cadence);
        }
        if(type==='cycling'){
            const elevation=+inputElevation.value;
            if(!validinput(distance,duration,elevation)||!allPositive(distance,duration))
            return alert('Inputs have to be positive!');

            workout=new Cycling(distance,duration,[lat,lng],elevation);
        }

        // Add new object to workout array
        this.#workouts.push(workout);
        console.log(this.#workouts);

        //Render workout on map as marker
        this._rendorWorkoutMarker(workout);

        //Render workout on list 
        this._rendorWorkout(workout);

        //Hide form + clear input fields
        this._hideform();
        //set localstorage
        this._setLocalStorage();

    }

   _movetoPopup(e){
       const workoutElement=e.target.closest('.workout');
       if(!workoutElement) return ;
       const workout=this.#workouts.find(work=>work.id===workoutElement.dataset.id);
       this.#map.setView(workout.coords,this.#mapZoomLevel,{
           animate:true,
           pan:{
               duration:1,
           }
       });

   }

  //edit values=====================

 _editValue(e)
 {
 const target=e.target.closest('.workout');

 if(target.dataset.id==='running')
 {
     console.log('dsf');
 }
 if(target.dataset.id==='cycling'){
     console.log('adk');
 }
 }












 
    _rendorWorkoutMarker(workout){
    
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth:250,
            minWidth:100,
            autoClose:false,
            closeOnClick:false,
            className:`${workout.type}-popup`,
        })
        )
        .setPopupContent(`${workout.type==='running'?'🏃‍♂️':'🚴‍♀️'} ${workout.discription}`)
        .openPopup();  
    }

  _rendorWorkout(workout){
     let html=`
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.discription}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type==='running'?'🏃‍♂️':'🚴‍♀️'}</span>
                <span class="workout__value distance">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value duration">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>`;
  
    
       
     if(workout.type==='running'){
       html+= `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value ">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value cadence">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
        </li>`;
     }
     if(workout.type==='cycling'){
      html+=`
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value elevationGain">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
      </li>`;
     }
     form.insertAdjacentHTML('afterend',html);
    }
   
    _setLocalStorage(){
        localStorage.setItem('workouts',JSON.stringify(this.#workouts));
    }
    _getLocalStorage(){
        const data=JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if(!data)return ;
        this.#workouts=data;
        this.#workouts.forEach(work=>{
            this._rendorWorkout(work);
        });
    }



    
    reset (){
        localStorage.removeItem('workouts');
        location.reload();
    }
}
//CLASS DECLARATION------------------------------------
const app=new App();







