# Tutorial DIPS – OjOs

*DIPS-OjOS* (Detecting Irregular Photometric Signals OJimetrO Survey) es un proyecto cuya finalidad es revisar curvas de luz de estrellas con tránsitos de exoplanetas para inspeccionar y clasificar todos los tránsitos presentes en ellas. El objetivo es detectar ciertas anomalías sutiles que puedan estar presentes en dichos tránsitos y que puedan delatar eventos de cruce sobre manchas, fulguraciones estelares, presencia de anillos, polvo, variaciones en las duraciones de los tránsitos o la presencia de cuerpos adicionales como podrían ser exolunas.

Comenzamos validándonos en el sitio web del proyecto [http://dipsojos.uniovi.es](http://dipsojos.uniovi.es) con nuestro usuario y contraseña y pulsamos *Entrar* (se puede acceder en modo de pruebas con el usuario *public* y la contraseña *public*).

![](/docs/tutorial/es/1.png)

Una vez dentro de la aplicación, en el panel izquierdo veremos las curvas disponibles para clasificar (Todas). También podemos ver todas las curvas pendientes de clasificar (Pendientes) y las que ya hemos terminado de clasificar (Completas). Al lado del identificador de cada curva (Curva #) se muestra una barra de progreso que indica el estado de clasificación de cada curva, así como el número de tránsitos clasificados / tránsitos totales de cada curva.

![](/docs/tutorial/es/2.png)

Las curvas pueden ser reales o simuladas, de manera que las inspeccionaremos en modo ciego, sin saber con qué tipo de curva estamos trabajando. Las curvas simuladas representan tránsitos de exoplanetas con parámetros físicos realistas, con o sin satélites, transitando estrellas con y sin manchas, con variedades de radios para la estrella, el planeta, y los posibles satélites, con variaciones en el tiempo de los tránsitos (TTVs), con diferentes períodos y semiejes orbitales… Analizar curvas simuladas nos servirá para cuantificar la eficiencia del trabajo, al generar más o menos falsos positivos y al recuperar o no ciertas señales que sabemos están presentes en las curvas simuladas.

En la parte central de la herramienta se presenta la figura principal. Es una gráfica flujo versus tiempo (en días) compuesta por los puntos reales de la curva (puntos blancos) y el modelo de ajuste teórico (curva roja) calculado por el código y que mejor ajusta de manera global a todos los tránsitos de la curva. Las desviaciones de los puntos respecto del modelo teórico reflejan posibles fenómenos que podrían estar teniendo lugar y que son precisamente lo que queremos detectar y estudiar.

Encima de la curva se indica la variación en el tiempo del tránsito (TTV, Transit Timing Variation) que el modelo obtiene. El tránsito debiera ocurrir en un cierto instante de tiempo teórico que el código calcula a partir del tiempo central tabulado oficialmente para el primer tránsito de ese exoplaneta (el *t0*) y su período orbital. Ahora bien, cuando el código ajusta el modelo a cada tránsito, obtiene un tiempo central para cada tránsito. La diferencia entre el *tc_teórico* y el *tc_calculado* es lo que se conoce como TTV y puede ser resultado del ruido presente en el tránsito, el efecto de manchas estelares o realmente ser debido a la influencia de otros planetas o incluso por la presencia de exolunas.

Debajo de la figura del tránsito tenemos la figura de los residuales. Esta representa cuánto se desvía cada punto real respecto del modelo, y puede darnos información incluso de manera más clara que la figura del tránsito.

![](/docs/tutorial/es/3.png)

En la parte derecha de la aplicación se presenta otro panel con ciertos parámetros para los tránsitos de ese exoplaneta (tanto teóricos como los ajustados por el modelo). Además podremos navegar por los diferentes tránsitos de la curva de luz con los botones < (anterior) y > (siguiente).

![](/docs/tutorial/es/4.png)

A la derecha también tenemos los diferentes check boxes que nos permiten clasificar cada uno de los tránsitos, así como una caja de texto en la que podemos escribir anotaciones. Hemos de inspeccionar con detalle la figura central que presenta los datos de cada tránsito junto con el modelo, así como la figura de los residuales. Si detectamos alguna anomalía hemos de reportarlo marcando el check box correspondiente (podemos marcar varios check boxes en un mismo tránsito). Una vez marcado, cuando nos movamos a otro tránsito, lo que hayamos marcado se grabará automáticamente en la base de datos. Si volvemos a inspeccionar el mismo tránsito y cambiamos la clasificación, esto se refrescará automáticamente en la base de datos, y si pulsamos el botón *Eliminar clasificaciones*, borraremos todas las clasificaciones que hayamos hecho para los tránsitos de la curva que estemos estudiando.

![](/docs/tutorial/es/5.png)

Ejemplos de clasificación:

**Morfología Normal**: los puntos observados están distribuidos de manera uniforme en torno al modelo. Las desviaciones son uniformes y son debidas al ruido.

![](/docs/tutorial/es/6.png)

**Morfología Anómala:** marcaremos este check si detectamos alguna estructura en el tránsito que no encaje en ninguna de las demás categorías. Se pueden hacer comentarios en la caja de **Notas** que completen la inspección de cualquier tránsito.

![](/docs/tutorial/es/7.png)

**Asimetría Izquierda / Derecha**: si advertimos que en la entrada / salida del tránsito hay alguna desviación clara.

![](/docs/tutorial/es/8.png)

![](/docs/tutorial/es/9.png)

**Aumento de flujo interior**: si advertimos un aumento claro de flujo en la región central del tránsito.

![](/docs/tutorial/es/10.png)

**Disminución de flujo interior**: si detectamos que el flujo en la zona central del tránsito está claramente por debajo del modelo.

![](/docs/tutorial/es/11.png)

**TDV marcada**: marcaremos este check (Variación en la Duración del Tránsito) si advertimos que claramente la duración del tránsito es mayor o menor que la del modelo teórico.

![](/docs/tutorial/es/12.png)

**Mal ajuste del modelo**: marcaremos este check si claramente el modelo ha fracasado al ajustar el tránsito observado.

![](/docs/tutorial/es/13.png)
