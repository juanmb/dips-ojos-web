# Emoons–OjOs Tutorial

*Emoons-OjOs* is a project aimed at reviewing light curves of stars with exoplanet transits to inspect and classify all transits present in them. The objective is to detect certain features that may be present in these transits, such as occlusions of starspots as exoplanets transit across the stellar disk or possible signatures originating from exomoons.

We start by validating ourselves on the project website ([https://emoons.twave.link/](https://emoons.twave.link/) as of 25/08/2025) with our username and password and click *Sign In*:

![](/docs/tutorial/1.png)

Once inside the application, we click on *Select a curve* and a dropdown list will appear with all the curves we can inspect:

![](/docs/tutorial/2.png)

In this dropdown list, curves accompanied by the icon *![](/docs/tutorial/3.png)* are those we have never inspected. Those accompanied by the icon ![](/docs/tutorial/4.png) are those we have already started to inspect but have not finished classifying all their transits. Finally, those accompanied by the icon *![](/docs/tutorial/5.png)*, are those in which we have already classified all their transits. Although we have already classified the transits of a curve, we can review them again and make changes to the classification. These changes are updated in the database.

The curves can be real or simulated, so we will inspect them without knowing what type of curve we are working with. Simulated curves represent exoplanet transits that could really exist, with or without satellites, transiting stars with and without starspots, with varieties of radii (star, planet, satellite), with variations in transit times (TTVs), with different periods and orbital semi-major axes... Analyzing simulated curves will help us quantify afterwards the efficiency of our work when recovering or not certain signals that we know are present in the simulated curves.

When we select a curve, a figure will appear showing the first transit of the curve, or if we have already worked previously with that curve, we will be presented with the transit following the last one we classified.

![](/docs/tutorial/6.png)

Above the figure we will see buttons "Previous" and "Next" that allow us to move through each of the transits of the curve.

The main figure is a flux versus time graph (in days) composed of the real data points of the curve (black dots) and the theoretical fit model (red curve) calculated by the code and that best fits all the transits of the curve globally. Deviations of the black dots from the theoretical model reflect possible phenomena that could be taking place and that are precisely what we want to study.

Above the curve appears the variation in transit time (TTV, Transit Timing Variation) that the model computes for that transit. The transit should occur at a certain theoretical time that the code calculates from the centrally timed officially tabulated time for the first transit of that exoplanet (the *t0*) and its orbital period. Now, when the code fits the model (red line) to each transit, it obtains a calculated central time for each transit. The difference between tc_teórico and tc_calculado is what is known as TTV and may be the result of the influence of other planets, because the orbit is very eccentric or even by the presence of exomoons.

Below the transit figure we have the figure of the residuals. This figure represents how much each real point deviates from the model, and can give us information even more clearly than the transit figure.

![](/docs/tutorial/7.png)![](/docs/tutorial/8.png)

In this example, clear deviations can be seen in the residuals both at the entry and exit of the transit. Also in the central zone the residuals are consistently below the zero value, which corresponds to the model. This means that the flux within the transit is lower than the model.

In this example, you can see how the points are distributed uniformly around the model. The dispersion is due to noise, no clear deviations are apparent.

![](/docs/tutorial/9.png)

Below the residual figure, we find information relating to the planetary radius and orbital semi-major axis (both in units of stellar radius: *Rp/R\** and *ap/R\**) theoretical that the code reads from each data file along with these same parameters that the code adjusts to obtain the model that best represents all the transits of the curve.

On the right we have the different checkboxes that allow us to classify each of the transits. We must inspect in detail the figure that presents the transit data along with the model, as well as the residuals figure. If we detect any irregularity we must report it by checking the corresponding checkbox. Once marked, when we click the "Next" button to inspect the next transit, what we have marked will be automatically saved to the database.

Classification examples:

**Normal Morphology**: the points are distributed uniformly around the model. The deviations are uniform and are due to noise. ![](/docs/tutorial/10.png)

**Anomalous Morphology:** we will check this box if we detect any structure in the transit that does not fit into any of the other categories. Comments can be made in the **Notes** box that complement the inspection of any transit.

![](/docs/tutorial/11.png)

**Left / Right Asymmetry**: if we notice that at the entry / exit of the transit there is a clear deviation.

![](/docs/tutorial/12.png)

**Interior Flux Increase**: if we notice a clear increase in flux in the central region of the transit. This could be caused by the planet passing in front of a starspot on the host star or by mutual phenomena with a possible satellite.

![](/docs/tutorial/13.png)

**Interior Flux Decrease**: if we detect that the flux in the central zone of the transit is clearly below the model. This could be caused by the extra contribution of a possible satellite and therefore the code cannot model it correctly.

![](/docs/tutorial/14.png)

**Marked TDV**: we will check this box (Transit Duration Variation) if we clearly notice that the duration of the transit is greater or less than that of the theoretical model.

This can originate if the planet shows marked TTVs or from geometric and/or gravitational effects caused by a possible satellite.

![](/docs/tutorial/15.png)

Of course, in the same transit we can mark more than one feature if we detect more than one present:

![](/docs/tutorial/16.png)

Finally, if on the left we click the button ![](/docs/tutorial/17.png) we can review all the curves there are and our review status:

![](/docs/tutorial/18.png)

To review curves again we will first click the button ![](/docs/tutorial/19.png) and then select the curve we want to review.
