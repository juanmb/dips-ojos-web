# Tutorial Emoons – OjOs

*Emoons-OjOs* es un proyecto con la finalidad de revisar curvas de luz de estrellas con tránsitos de exoplanetas para inspeccionar y clasificar todos los tránsitos presentes en ellas. El objetivo es detectar ciertas características que puedan estar presentes en dichos tránsitos, como ocultaciones de manchas estelares al transitar los exoplanetas sobre el disco estelar o posibles huellas originadas por exolunas.

Comenzamos validándonos en el sitio web del proyecto ([https://emoons.twave.link/](https://emoons.twave.link/) a fecha 25/08/2025) con nuestro usuario y contraseña y pulsamos *Iniciar Sesión*:

![](/docs/tutorial/1.png)

Una vez dentro de la aplicación, hacemos click sobre *Selecciona una curva* y nos aparecerá una lista desplegable con todas las curvas que podemos inspeccionar:

![](/docs/tutorial/2.png)

En esta lista desplegable, las curvas acompañadas del icono *![](/docs/tutorial/3.png)* son aquellas que nunca hemos inspeccionado. Las acompañadas del icono ![](/docs/tutorial/4.png) son aquellas que ya hemos empezado a inspeccionar pero no hemos terminado de clasificar todos sus tránsitos. Por último, las acompañadas del icono *![](/docs/tutorial/5.png)*, son aquellas en las que ya hemos clasificado todos sus tránsitos. Aunque ya hayamos clasificado los tránsitos de una curva, podemos volver a revisarlos y realizar cambios en la clasificación. Estos cambios se actualizan en la base de datos.

Las curvas pueden ser reales o simuladas, de manera que las inspeccionaremos sin saber en qué tipo de curva estamos trabajando. Las curvas simuladas representan tránsitos de exoplanetas que realmente podrían existir, con o sin satélites, transitando estrellas con y sin manchas, con variedades de radios (estrella, planeta, satélite), con variaciones en el tiempo de los tránsitos (TTVs), con diferentes períodos y semiejes orbitales… Analizar curvas simuladas nos servirá para cuantificar a posteriori la eficiencia de nuestro trabajo al recuperar o no ciertas señales que sabemos están presentes en las curvas simuladas.

Cuando seleccionemos una curva aparecerá una figura en la que se muestra el primer tránsito de la curva, o si ya hemos estado trabajando previamente con esa curva, se nos presentará el tránsito siguiente al último que hayamos clasificado.

![](/docs/tutorial/6.png)

Encima de la figura veremos unos botones «Anterior» y «Siguiente» que nos permiten movernos por cada uno de los tránsitos de la curva.

La figura principal es una gráfica flujo versus tiempo (en días) compuesta por los puntos reales de la curva (puntos negros) y el modelo de ajuste teórico (curva roja) calculado por el código y que mejor ajusta de manera global a todos los tránsitos de la curva. Las desviaciones de los puntos negros respecto del modelo teórico reflejan posibles fenómenos que podrían estar teniendo lugar y que son precisamente lo que queremos estudiar.

Encima de la curva aparece la variación en el tiempo del tránsito (TTV, Transit Timing Variation) que el modelo computa para ese tránsito. El tránsito debiera ocurrir en un cierto instante de tiempo teórico que el código calcula a partir del tiempo central tabulado oficialmente para el primer tránsito de ese exoplaneta (el *t0*) y su período orbital. Ahora bien, cuando el código ajusta el modelo (línea roja) a cada tránsito, obtiene un tiempo central calculado para cada tránsito. La diferencia entre el tc_teórico y el tc_calculado es lo que se conoce como TTV y puede ser resultado de la influencia de otros planetas, porque la órbita sea muy excéntrica o incluso por la presencia de exolunas.

Debajo de la figura del tránsito tenemos la figura de los residuales. Esta figura representa cuánto está desviado cada punto real respecto del modelo, y puede darnos información incluso de manera más clara que la figura del tránsito.

![](/docs/tutorial/7.png)![](/docs/tutorial/8.png)

En este ejemplo se aprecian en los residuales desviaciones claras tanto en la entrada como en la salida del tránsito. Además en la zona central los residuales están consistentemente por debajo del valor cero, al que se corresponde el modelo. Esto quiere decir que el flujo dentro del tránsito es inferior al del modelo.

En este ejemplo se aprecia cómo los puntos están distribuidos de una manera uniforme en torno al modelo. La dispersión es debida al ruido, no se aprecian desviaciones claras.

![](/docs/tutorial/9.png)

Debajo de la figura de los residuales, encontramos información relativa al radio planetario y al semieje orbital (ambos en unidades del radio estelar: *Rp/R\** y *ap/R\**) teóricos que el código lee de cada archivo de datos junto con esos mismos parámetros que el código ajusta para obtener el modelo que mejor representa a todos los tránsitos de la curva.

A la derecha tenemos las diferentes check boxes que nos permiten clasificar cada uno de los tránsitos. Hemos de inspeccionar con detalle la figura que presenta los datos del tránsito junto con el modelo, así como la figura de los residuales. Si detectamos alguna irregularidad hemos de reportarlo marcando el check box correspondiente. Una vez marcado, cuando pulsemos el botón «Siguiente» para inspeccionar el siguiente tránsito, lo que hayamos marcado se grabará automáticamente en la base de datos.

Ejemplos de clasificación:

**Morfología Normal**: los puntos están distribuidos de manera uniforme en torno al modelo. Las desviaciones son uniformes y están debidas al ruido. ![](/docs/tutorial/10.png)

**Morfología Anómala:** marcaremos este check si detectamos alguna estructura en el tránsito que no encaje en ninguna de las demás categorías. Se pueden hacer comentarios en la caja de **Notas** que completen la inspección de cualquier tránsito.

![](/docs/tutorial/11.png)

**Asimetría Izquierda / Derecha**: si advertimos que en la entrada / salida del tránsito hay alguna desviación clara.

![](/docs/tutorial/12.png)

**Aumento de flujo interior**: si advertimos un aumento claro de flujo en la región central del tránsito. Esto podría ser originado por que el planeta pase por delante de una mancha de la estrella anfitriona o por fenómenos mutuos con un posible satélite.

![](/docs/tutorial/13.png)

**Disminución de flujo interior**: si detectamos que el flujo en la zona central del tránsito está claramente por debajo del modelo. Esto podría ser causado por la contribución extra de un posible satélite y que por lo tanto el código no puede modelizar correctamente.

![](/docs/tutorial/14.png)

**TDV marcada**: marcaremos este check (Transit Duration Variation, Variación en la Duración del Tránsito) si advertimos que claramente la duración del tránsito es mayor o menor que la del modelo teórico.

Esto puede originarse si el planeta presenta TTVs marcadas o por efectos geométricos y/o gravitatorios originados por un posible satélite.

![](/docs/tutorial/15.png)

Por supuesto, en un mismo tránsito podemos marcar más de una característica si detectamos más de una presente:

![](/docs/tutorial/16.png)

Por último, si a la izquierda pulsamos el botón ![](/docs/tutorial/17.png) podremos revisar todas las curvas que hay y nuestro estado de revisión:

![](/docs/tutorial/18.png)

Para volver a revisar curvas pulsaremos primero el botón ![](/docs/tutorial/19.png) y a continuación seleccionamos la curva que queramos revisar.
