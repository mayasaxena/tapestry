function renderDAG() {
  (async () => {
      let params = new URLSearchParams(window.location.search.slice(1));
      let baseID = params.get('base-id')
      let apiKey = params.get('api-key')
      let language = params.get('language')

      // fetch data and render
      // Airtable returns at most 100 records per request, so keep following `offset` until every page is loaded
      const records = { records: [] }
      let offset = null
      do {
        const resp = await fetch(`https://api.airtable.com/v0/${baseID}/People?sort%5B0%5D%5Bfield%5D=Ordering&sort%5B0%5D%5Bdirection%5D=asc${offset ? `&offset=${encodeURIComponent(offset)}` : ''}`, {
          headers: { Authorization: `Bearer ${apiKey}` }
        });

        const page = await resp.json();
        records.records = records.records.concat(page.records)
        offset = page.offset
      } while (offset)

      const data = records.records.map(record => 
        ({
          id: record.id,
          parents: (record.fields.Parents ?? []).sort(),
          children: (record.fields.Children ?? []).sort(),
          partners: (record.fields.Partners ?? []).filter(id => id != record.id).sort(),
          name: record.fields.Name,
          image: 'Photo' in record.fields ? record.fields.Photo[0].url : null,
          birthDate: record.fields["Birth Date"],
          gender: record.fields.Gender,
          languages: record.fields.Languages
        })
      );

      const dataByID = data.reduce((dataByID, record) => {
        dataByID[record.id] = record
        return dataByID
      }, {});

      const connect = records.records.reduce((connect, record) => {
        // Person's parent to person
        if (record.fields.ParentUnionId) {
          connect.push({
            source: record.fields.ParentUnionId[0],
            target: record.id,
            fromUnion: true
          })
        }

        // Person to unions
        (record.fields.UnionIds ?? []).forEach(childId => {
          connect.push({
            source: record.id,
            target: childId,
          })
        })

        return connect
      }, []);
      
      var adjList = data.reduce((adjList, record) => {
        adjList[record.id] = record.partners.concat(record.parents).concat(record.children)
        return adjList
      }, {})

      const dag = d3.dagConnect()
        .sourceId(l => l.source)
        .targetId(l => l.target)
        (connect);
      const nodeRadius = 80;
      const layout = d3
        .sugiyama()
        .decross(d3.decrossOpt())
        .nodeSize((node) => [(node ? 3.6 : 0.25) * nodeRadius, 3 * nodeRadius]); // set node size instead of constraining to fit
      let width, height
      try {
        ({ width, height } = layout(dag));
      } catch {
        // decrossOpt refuses big trees, so fall back to the faster heuristic
        ({ width, height } = layout.decross(d3.decrossTwoLayer())(dag));
      }

      // --------------------------------
      // This code only handles rendering
      // --------------------------------

      var tip = d3.tip()
        .attr('class', 'd3-tip')
        .direction('s')
        .offset([10, 0])
        .html((_, d) => {
          const data = dataByID[d.data.id]
          if (data === undefined) { return }
          var relation = null
          
          var content = `<span style='margin-left: 2.5px;'><b> ${data.name} </b></span><br>`

          const selectedRelationships = relationships[selectedID]
         
          if (selectedRelationships) {
            const relationship = selectedRelationships[d.data.id]
            relation = definitions[language][relationship.key] + (relationship.fallback ?? "")
            console.log(relationship);
            content += `<span style='margin-left: 2.5px;'><b> ${relation} </b></span><br>`
          }

          return content.replace(new RegExp("null", "g"), "")
        });

      // var unionMidpoints = []

      const line = d3
        .line()
        .curve(d3.curveCatmullRom)
        .x((d) => d.x)
        .y((d) => d.y);


      function linkPath(s, d) {
        return `
        M${s.x},${s.y}
        L${d.x},${s.y}
          L${d.x},${d.y}
        `
      }

      function unionPath(s, d) {
        return `
          M${s.x},${s.y}
          L${d.x},${s.y}
        `
      }

      function zoomed({ transform }) {
        paths.attr("transform", transform);
        d3.select(".nodes").attr("transform", transform);
        d3.select(".union-nodes").attr("transform", transform)
      }

      const svgSelection = d3.select("svg");
      svgSelection
      .attr("viewBox", [0, 0, width, height]
      .join(" "))
      .call(d3.zoom().on("zoom", zoomed))
      .on("dblclick.zoom", null)
      .call(tip)
      const defs = svgSelection.append("defs");

      // Plot edges
      const paths = svgSelection
        .append("g")
        .selectAll("path")
        .data(dag.links())
        .enter()
        .append("path")
        .attr("d", (d) => {  
          if (d.target.dataChildren.length == 0 && !d.source.dataChildren[0].data.fromUnion) {
            return unionPath(d.source, d.target)
          } else {
            return linkPath(d.source, d.target)
          }
        })
        .attr("fill", "none")
        .attr("stroke-width", 4)
        .attr("stroke-linejoin", "round")
        .attr("stroke", "black");
    
      // Plot node circles

      // Select nodes
      const nodes = svgSelection
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(dag.descendants())
        .enter()
        .append("g")
        .filter((d) => dataByID.hasOwnProperty(d.data.id))
        .attr("transform", ({ x, y }) => `translate(${x}, ${y})`)

      nodes
        .append("path")
          // .attr("transform", "translate(400,200)")
          .attr("d", d3.arc()
            .innerRadius(nodeRadius - 2)
            .outerRadius(0)
            .startAngle(0)     // It's in radian, so Pi = 3.14 = bottom.
            .endAngle(Math.PI * 2)       // 2*Pi = 6.28 = top
            )
          .attr('fill', 'white');

      nodes
        .append("circle")
        .attr("r", nodeRadius)
        .attr("stroke-width", 4)
        .attr("stroke", "black")
        .attr("fill", (d) => {
          defs
          .append("pattern")
            .attr("id", d.data.id)
            .attr('height', '1')
            .attr('width', '1')
          .append("image")
            .attr("xlink:href", dataByID[d.data.id]?.image ?? "/fallback.png")
            .attr("width", nodeRadius * 2)
            .attr("height", nodeRadius * 2)
            .attr("x", 0)
            .attr("y", 0);

          return `url(#${d.data.id})`
        });

      // --------------------------------
      // Interactivity
      // --------------------------------
        var selectedID = null
        var relationships = {}

        function singleSelectClassOn(_this, node) {
          d3.selectAll(`.${node}`).classed(node, false);
          d3.select(_this).classed(node, true);
        }

        d3.selectAll("circle")
          .on('mouseover', (_, d) => {
              tip.show(_, d, selectedID);
          })
          .on('mouseout', tip.hide)
          .on('click', function (_, d) {
            selectedID = d.data.id
            if (!relationships[d.data.id]) {
              relationships[d.data.id] = getRelationships(dataByID, adjList, d.data.id, language)
            }
            singleSelectClassOn(this, "source")
            tip.show(_, d, selectedID);

          })
    })();
}